import { Mail, Globe, Linkedin, Instagram, Disc, Github, Gitlab } from "lucide-react"
import Link from "next/link"

export function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="w-full py-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    &copy; 2026 Ali Novruz. All rights reserved.
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6">
                    <a href="mailto:alinovruz29@gmail.com" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                        <Mail className="w-4 h-4" />
                        <span className="hidden sm:inline">alinovruz29@gmail.com</span>
                    </a>

                    <a href="https://alinovruz.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                        <Globe className="w-4 h-4" />
                        <span className="hidden sm:inline">alinovruz.app</span>
                    </a>

                    <a href="https://linkedin.com/in/ali-novruz-447115356" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors" title="LinkedIn">
                        <Linkedin className="w-5 h-5" />
                    </a>

                    <a href="https://gitlab.com/alinovruz29" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-orange-600 transition-colors" title="GitLab">
                        <Gitlab className="w-5 h-5" />
                    </a>

                    <a href="https://instagram.com/ali__novruz" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-pink-600 transition-colors" title="Instagram">
                        <Instagram className="w-5 h-5" />
                    </a>

                    <a href="https://discordapp.com/users/1099172944711798824" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-500 transition-colors" title="Discord">
                        <Disc className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </footer>
    )
}
