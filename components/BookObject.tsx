'use client';
import type {Book} from '../lib/catalog';
export default function BookObject({book,className='',onClick,style}:{book:Book;className?:string;onClick?:()=>void;style?:React.CSSProperties}){
return <button className={`book-object ${className}`} style={{'--book-color':book.color,...style} as React.CSSProperties} onClick={onClick} aria-label={`Open ${book.title}`}><span className="book-pages"/><span className="book-top"/><span className="book-back"><span>{book.title}</span><b>f.</b></span><span className="book-spine"><span>{book.title}</span><b>f.</b></span><span className="book-front"><img src={book.cover} alt={`${book.title} book cover`} loading={/hero-book|ring-book/.test(className)?'eager':'lazy'} draggable="false"/><span className="book-sheen"/></span></button>}
