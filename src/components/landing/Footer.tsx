import { Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-50 w-full border-t border-neutral-100 bg-white py-12 text-neutral-500">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-xl font-bold tracking-tight text-neutral-900">
              FUTURE <span className="text-[#22D3EE]">FINANCE</span>
            </h3>
            <p className="mt-2 text-sm">
              Reimagining the digital economy.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex gap-6">
            <a
              href="#"
              className="transition-colors hover:text-[#22D3EE]"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>
            <a
              href="#"
              className="transition-colors hover:text-[#22D3EE]"
              aria-label="GitHub"
            >
              <Github size={20} />
            </a>
            <a
              href="#"
              className="transition-colors hover:text-[#22D3EE]"
              aria-label="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-neutral-100" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
          <p>© {currentYear} Future Finance. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-neutral-900 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-neutral-900 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
