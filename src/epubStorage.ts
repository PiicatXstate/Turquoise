import Dexie from 'dexie';
import JSZip from 'jszip';

export default class epubStorage {
    private readonly bookid: string;

    static generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    constructor(bookid?: string) {
        this.bookid = bookid ? bookid : epubStorage.generateId();
    }

    getBookId(): string {
        return this.bookid;
    }

    async parseEpub(file: File): Promise<ArrayBuffer> {
        return await file.arrayBuffer();
    }

    async storageData(data: ArrayBuffer): Promise<void> {
        interface Book {
            bookid: string;
            fileData: ArrayBuffer;  // 存储 ArrayBuffer
            fileName: string;
            added: Date;
        }

        class MyDatabase extends Dexie {
            books!: Dexie.Table<Book, string>;

            constructor() {
                super('EpubLibrary');
                this.version(1).stores({
                    books: 'bookid, fileName, added'
                });
            }
        }

        const db = new MyDatabase();
        
        await db.books.put({
            bookid: this.bookid,
            fileData: data,
            fileName: `epub_${Date.now()}`,
            added: new Date()
        });
    }
    
    static async loadBook(bookid: string): Promise<ArrayBuffer | null> {
        class MyDatabase extends Dexie {
            books!: Dexie.Table<{ bookid: string; fileData: ArrayBuffer }, string>;
            
            constructor() {
                super('EpubLibrary');
                this.version(1).stores({
                    books: 'bookid'
                });
            }
        }

        const db = new MyDatabase();
        const book = await db.books.get(bookid);
        return book ? book.fileData : null;
    }

    static async dpArrayBuffer(arrayBuffer: ArrayBuffer | any){
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(arrayBuffer);
        return zipContent
    }

    /**
     * 通过书籍ID获取小说信息和封面
     * @param bookid 书籍ID
     * @returns 返回包含书名和封面的对象 {title: string, cover: Blob|null}
     */
    static async getBookInfo(bookid: string): Promise<{title: string, cover: Blob | null}> {
        // 1. 加载书籍数据
        const arrayBuffer = await this.loadBook(bookid);
        if (!arrayBuffer) {
            throw new Error('未找到该书籍');
        }

        // 2. 解析EPUB(ZIP)文件
        const zip = await this.dpArrayBuffer(arrayBuffer);
        
        // 3. 查找container.xml定位OPF文件路径
        const containerFile = zip.file('META-INF/container.xml');
        if (!containerFile) {
            throw new Error('EPUB格式无效：未找到container.xml');
        }
        
        const containerContent = await containerFile.async('text');
        const opfPathMatch = containerContent.match(/<rootfile[^>]*full-path="([^"]*)"[^>]*\/>/i);
        if (!opfPathMatch || !opfPathMatch[1]) {
            throw new Error('EPUB格式无效：未找到OPF文件路径');
        }
        
        const opfPath = opfPathMatch[1];
        const opfDirectory = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
        
        // 4. 解析OPF文件内容
        const opfFile = zip.file(opfPath);
        if (!opfFile) {
            throw new Error('EPUB格式无效：未找到OPF文件');
        }
        
        const opfContent = await opfFile.async('text');
        
        // 5. 提取书名
        const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]*)<\/dc:title>/i);
        const title = titleMatch ? titleMatch[1] : '未知书名';
        
        let coverPath: string | null = null;

    // 6.1 先查找metadata中定义的封面
    const coverIdMatch = opfContent.match(/<meta[^>]*name="cover"[^>]*content="([^"]*)"[^>]*\/>/i);
    
    if (coverIdMatch) {
        const coverId = coverIdMatch[1];
        const coverItemMatch = new RegExp(`<item[^>]*id="${coverId}"[^>]*href="([^"]*)"[^>]*\/>`, 'i').exec(opfContent);
        if (coverItemMatch) {
            coverPath = coverItemMatch[1];
        }
    }
    
    // 6.2 如果没有明确定义的封面，尝试常见封面文件名
    if (!coverPath) {
        const commonCoverNames = ['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.gif'];
        for (const name of commonCoverNames) {
            // 修复：使用绝对路径检查
            const fullPath = `${opfDirectory}${name}`;
            if (zip.file(fullPath)) {
                coverPath = name;
                break;
            }
        }
    }
    
    // 7. 获取封面图片Blob
    let coverBlob: Blob | null = null;
    if (coverPath) {
        // 修复：标准化路径处理
        const normalizedPath = coverPath.startsWith('/') 
            ? coverPath.substring(1) 
            : `${opfDirectory}${coverPath}`;
        
        const coverFile = zip.file(normalizedPath);
        if (coverFile) {
            try {
                // 使用 'blob' 类型获取数据
                const blobData = await coverFile.async('blob');
                // 获取正确的 MIME 类型
                const mimeType = this.getMimeTypeFromExtension(coverPath);
                // 创建带类型的新 Blob
                coverBlob = new Blob([blobData], { type: mimeType });
            } catch (e) {
                console.error('封面读取失败:', e);
                coverBlob = null;
            }
        }
    }
    
    return {
        title,
        cover: coverBlob
    };
    }

    /**
     * 根据文件扩展名获取MIME类型
     * @param filename 文件名
     * @returns 对应的MIME类型字符串
     */
    private static getMimeTypeFromExtension(filename: string): string {
        const extension = filename.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'svg':
                return 'image/svg+xml';
            case 'webp':
                return 'image/webp';
            default:
                return 'application/octet-stream';
        }
    }
}