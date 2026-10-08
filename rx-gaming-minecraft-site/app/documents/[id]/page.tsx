import { notFound } from "next/navigation";
import Navbar from "@/component/navbar";
import Footer from "@/component/footer";
import Link from "next/link";
import { documents } from "@/lib/documents";

export function generateStaticParams() {
  return documents.map(document => ({ id: String(document.id) }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: documents.find(document => String(document.id) === id)?.title ?? "Document not found" };
}

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = documents.find(doc => String(doc.id) === id);
  if (!doc) notFound();
  return <div className="min-h-screen flex flex-col bg-page text-foreground"><Navbar />
    <main id="main-content" className="max-w-7xl mx-auto w-full px-4 py-8 flex-1 space-y-8">
      <h1 className="text-3xl md:text-5xl font-black uppercase">Documents</h1>
      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-8">
        <nav aria-label="Documents" className="space-y-3">{documents.map(item => <Link key={item.id} aria-current={item.id === doc.id ? "page" : undefined} href={`/documents/${item.id}`} className="panel block font-bold"><span aria-hidden="true">{item.icon}</span> {item.title}</Link>)}</nav>
        <article className="panel space-y-6"><h2 className="text-2xl font-bold border-b-4 border-frame pb-4">{doc.title}</h2><div className="whitespace-pre-line text-sm leading-7 text-muted">{doc.content}</div></article>
      </div>
    </main><Footer /></div>;
}
