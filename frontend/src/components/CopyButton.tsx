import { CheckIcon, CopyIcon } from "lucide-react"
import { useState } from "react"

const COPY_NOTIFY_DURATION_MS = 1500

export default function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const copy = async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), COPY_NOTIFY_DURATION_MS)
    }

    return (
        <button type="button" 
            className="btn btn-outline btn-sm"
            onClick={copy}
            disabled={!text}>
            {copied ? <CheckIcon /> : <CopyIcon />} {copied ? 'Copied!' : 'Copy'}
        </button>
    )
}