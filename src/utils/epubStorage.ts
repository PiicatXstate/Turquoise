import Dexie from 'dexie';
import JSZip from 'jszip';


/**
 * EPUB 电子书存储管理类
 * 提供电子书的解析、存储、加载和信息获取功能
 */

export default class epubStorage {
    private readonly bookid: string;

    /**
     * 生成一个唯一的书籍ID
     * @returns 生成的唯一ID字符串
    */
    static generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }


    /**
     * 构造函数
     * @param bookid 可选的书籍ID，如果不提供则自动生成
     */
    constructor(bookid?: string) {
        this.bookid = bookid ? bookid : epubStorage.generateId();
    }

    /**
     * 获取当前书籍ID
     * @returns 当前书籍的ID
     */
    getBookId(): string {
        return this.bookid;
    }

    /**
     * 解析EPUB文件为ArrayBuffer
     * @param file 要解析的EPUB文件
     * @returns 解析后的ArrayBuffer
     */
    async parseEpub(file: File): Promise<ArrayBuffer> {
        return await file.arrayBuffer();
    }

    /**
     * 存储EPUB文件数据到数据库
     * @param data 要存储的ArrayBuffer数据
     * @returns Promise<void>
     */
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
    
    /**
     * 根据书籍ID加载书籍数据
     * @param bookid 要加载的书籍ID
     * @returns 包含书籍数据的ArrayBuffer，如果未找到则返回null
     */
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

    /**
     * 将ArrayBuffer解压为JSZip对象
     * @param arrayBuffer 要解压的ArrayBuffer数据
     * @returns 解压后的JSZip对象
     */
    static async dpArrayBuffer(arrayBuffer: ArrayBuffer | any): Promise<JSZip> {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(arrayBuffer);
        return zipContent;
    }

    /**
     * 通过书籍ID获取小说信息和封面
     * @param bookid 书籍ID
     * @returns 返回包含书名和封面的对象 {title: string, cover: Blob|null}
     * @throws 如果未找到书籍或EPUB格式无效会抛出错误
     */
    static async getBookInfo(bookid: string): Promise<{title: string, cover: Blob | null}> {
        const arrayBuffer = await this.loadBook(bookid);
        if (!arrayBuffer) {
            throw new Error('未找到该书籍');
        }

        const zip = await this.dpArrayBuffer(arrayBuffer);
        
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
        
        const opfFile = zip.file(opfPath);
        if (!opfFile) {
            throw new Error('EPUB格式无效：未找到OPF文件');
        }
        
        const opfContent = await opfFile.async('text');
        
        const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]*)<\/dc:title>/i);
        const title = titleMatch ? titleMatch[1] : '未知书名';
        
        let coverPath: string | null = null;

        const coverIdMatch = opfContent.match(/<meta[^>]*name="cover"[^>]*content="([^"]*)"[^>]*\/>/i);
        
        if (coverIdMatch) {
            const coverId = coverIdMatch[1];
            const coverItemMatch = new RegExp(`<item[^>]*id="${coverId}"[^>]*href="([^"]*)"[^>]*\/>`, 'i').exec(opfContent);
            if (coverItemMatch) {
                coverPath = coverItemMatch[1];
            }
        }
        
        if (!coverPath) {
            const commonCoverNames = ['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.gif'];
            for (const name of commonCoverNames) {
                const fullPath = `${opfDirectory}${name}`;
                if (zip.file(fullPath)) {
                    coverPath = name;
                    break;
                }
            }
        }
        
        let coverBlob: Blob | null = null;
        if (coverPath) {
            const normalizedPath = coverPath.startsWith('/') 
                ? coverPath.substring(1) 
                : `${opfDirectory}${coverPath}`;
            
            const coverFile = zip.file(normalizedPath);
            if (coverFile) {
                try {
                    const blobData = await coverFile.async('blob');
                    const mimeType = this.getMimeTypeFromExtension(coverPath);
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

    /**
     * 获取所有书籍的ID和基本信息（不包含文件数据）
     * @returns 返回包含书籍ID和基本信息的数组 [{bookid: string, fileName: string, added: Date}]
     */
    static async getAllBookIds(): Promise<Array<{bookid: string, fileName: string, added: Date}>> {
        class MyDatabase extends Dexie {
            books!: Dexie.Table<{ bookid: string; fileName: string; added: Date }, string>;
            
            constructor() {
                super('EpubLibrary');
                this.version(1).stores({
                    books: 'bookid, fileName, added'
                });
            }
        }

        const db = new MyDatabase();
        return await db.books.toArray();
    }


    /**
     * 根据书籍ID删除书籍
     * @param bookid 要删除的书籍ID
     * @returns Promise<void>
     */
    static async deleteBook(bookid: string): Promise<void> {
        class MyDatabase extends Dexie {
            books!: Dexie.Table<{ bookid: string }, string>;
            
            constructor() {
                super('EpubLibrary');
                this.version(1).stores({
                    books: 'bookid, fileName, added'
                });
            }
        }

        const db = new MyDatabase();
        await db.books.delete(bookid);
    }

}