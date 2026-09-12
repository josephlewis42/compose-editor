import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('space-y-2 text-sm leading-relaxed', className)}>
      <ReactMarkdown
        components={{
          a: (props) => (
            <a {...props} className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" />
          ),
          code: (props) => (
            <code {...props} className="rounded bg-base-200 px-1 py-0.5 font-mono text-[0.85em]" />
          ),
          ul: (props) => <ul {...props} className="list-disc space-y-1 pl-5" />,
          ol: (props) => <ol {...props} className="list-decimal space-y-1 pl-5" />,
          p: (props) => <p {...props} className="[&:not(:first-child)]:mt-2" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
