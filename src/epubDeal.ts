// epubDeal.ts
import { Book, EpubCFI } from 'epubjs';
import localforage from 'localforage';

type BookMetadata = {
  id: string;
  title: string;
  cover: string | null;
  createdAt: Date;
};

class EpubDeal {
  private readonly db: LocalForage;
  private bookInstance: Book | null = null;
  private readonly id: string;

  constructor(id: string) {
    this.id = id;
    this.db = localforage.createInstance({
      name: 'EPUB_LIBRARY',
      storeName: `BOOK_${id}`
    });
  }

  // 初始化数据库
  private async initDB(): Promise<void> {
    await this.db.ready();
  }

  // 生成随机ID (静态方法)
  static generateId(): string {
    return 'epub-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // 上传并解析EPUB文件
  async uploadEpub(file: File): Promise<BookMetadata> {
    await this.initDB();
    
    // 创建epub.js实例
    this.bookInstance = new Book(file);
    
    // 解析元数据
    const metadata = await this.bookInstance.loaded.metadata;
    const cover = await this.getCover();
    
    // 存储书籍数据
    const bookData: BookMetadata = {
      id: this.id,
      title: metadata.title || file.name,
      cover,
      createdAt: new Date()
    };
    
    await this.db.setItem('metadata', bookData);
    
    // 存储原始文件
    await this.db.setItem('epubFile', file);
    
    return bookData;
  }

  // 获取封面
  private async getCover(): Promise<string | null> {
    if (!this.bookInstance) return null;
    
    try {
      const cover = await this.bookInstance.archive.getBase64(
        this.bookInstance.cover || ''
      );
      return cover || null;
    } catch {
      return null;
    }
  }

  // 获取书籍数据
  async getBookData(): Promise<BookMetadata | null> {
    await this.initDB();
    return await this.db.getItem('metadata');
  }

  // 获取epub实例
  async getEpubInstance(): Promise<Book | null> {
    await this.initDB();
    
    if (!this.bookInstance) {
      const file = await this.db.getItem<File>('epubFile');
      if (file) this.bookInstance = new Book(file);
    }
    
    return this.bookInstance;
  }

  // 删除当前书籍
  async deleteBook(): Promise<void> {
    await this.db.clear();
    await localforage.dropInstance({
      name: 'EPUB_LIBRARY',
      storeName: `BOOK_${this.id}`
    });
  }

  // 静态方法：获取所有书籍ID
  static async getAllBookIds(): Promise<string[]> {
    const stores = await localforage.stores();
    return stores
      .map(store => store.storeName.replace('BOOK_', ''))
      .filter(name => name.startsWith('epub-'));
  }
}

export default EpubDeal;