import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('space-y-2 text-sm leading-relaxed', className)}>
      <ReactMarkdown
        components={{
          a: MdA,
          code: MdCode,
          ul: MdUl,
          ol: MdOl,
          p: MdP,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}


function MdA({...props}: React.ClassAttributes<HTMLAnchorElement> & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={props.href} className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" />
  )
}

function MdCode() {
  return (
    <code className="rounded bg-base-200 px-1 py-0.5 font-mono text-[0.85em]" />
  )
}

function MdUl() {
  return (
    <ul className="list-disc space-y-1 pl-5" />
  )
}

function MdOl() {
  return (
    <ol className="list-decimal space-y-1 pl-5" />
  )
}

function MdP() {
  return (
    <p className="[&:not(:first-child)]:mt-2" />
  )
}