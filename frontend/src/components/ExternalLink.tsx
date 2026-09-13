export function ExternalLink({ href, text }: { href: string; text: string }) {
    return (
        <a href={href} target="_blank" rel="noreferrer" className="link">
            {text}
        </a>
    )
}
