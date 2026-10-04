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
    <a {...props} className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" />
  )
}

function MdCode({...props}: React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement>) {
  return (
    <code  {...props} className="rounded bg-base-200 px-1 py-0.5 font-mono text-[0.85em]" />
  )
}

function MdUl({...props}: React.HTMLAttributes<HTMLElement>) {
  return (
    <ul  {...props} className="list-disc space-y-1 pl-5" />
  )
}

function MdOl({...props}: React.HTMLAttributes<HTMLElement>) {
  return (
    <ol {...props} className="list-decimal space-y-1 pl-5" />
  )
}

function MdP({...props}: React.HTMLAttributes<HTMLElement>) {
  return (
    <p {...props} className="[&:not(:first-child)]:mt-2" />
  )
}