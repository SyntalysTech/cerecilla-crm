"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Eye,
  Code,
  Type,
  Image as ImageIcon,
  Square,
  Minus,
  Link2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  Columns,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Palette,
  Share2,
  Paperclip,
  ExternalLink,
  LayoutPanelTop,
  UserMinus,
  FileText,
  File,
  Plus,
} from "lucide-react";
import { createTemplate, updateTemplate, TemplateFormData } from "./actions";
import { createClient } from "@/lib/supabase/client";

interface TemplateFormProps {
  template?: {
    id: string;
    name: string;
    subject: string;
    html: string;
    text: string;
  };
}

type BlockType = "header" | "text" | "image" | "button" | "divider" | "spacer" | "columns" | "social" | "link" | "attachment" | "footer" | "unsubscribe";

type ColumnContentType = "text" | "image" | "link" | "file";

// Social media icons SVGs for email compatibility
const socialIcons = {
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  twitter: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  tiktok: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  email: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  website: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
};

const socialColors: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  twitter: "#000000",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  tiktok: "#000000",
  whatsapp: "#25D366",
  email: "#666666",
  website: "#666666",
};

interface EmailBlock {
  id: string;
  type: BlockType;
  content: Record<string, string | number>;
}

const defaultBlocks: EmailBlock[] = [
  {
    id: "header-1",
    type: "header",
    content: {
      text: "Cerecilla",
      backgroundColor: "#BB292A",
      textColor: "#ffffff",
      padding: "40",
      fontSize: "28",
    },
  },
  {
    id: "text-1",
    type: "text",
    content: {
      text: "Hola,\n\nEste es el contenido de tu email. Personaliza este texto según tus necesidades.\n\nSaludos,\nEl equipo de Cerecilla",
      textColor: "#666666",
      fontSize: "16",
      align: "left",
      padding: "40",
    },
  },
  {
    id: "divider-1",
    type: "divider",
    content: {
      color: "#eeeeee",
      height: "1",
    },
  },
  {
    id: "text-2",
    type: "text",
    content: {
      text: "© 2025 Cerecilla SL. Todos los derechos reservados.",
      textColor: "#999999",
      fontSize: "12",
      align: "center",
      padding: "20",
      backgroundColor: "#f8f8f8",
    },
  },
];

function parseHtmlToBlocks(html: string): EmailBlock[] {
  // Si el HTML es el default o muy simple, devolver bloques por defecto
  if (!html || html.length < 100) {
    return defaultBlocks;
  }
  // Por ahora, devolver bloques por defecto - se puede mejorar el parsing después
  return defaultBlocks;
}

function blocksToHtml(blocks: EmailBlock[]): string {
  const bodyContent = blocks
    .map((block) => {
      switch (block.type) {
        case "header":
          return `
    <tr>
      <td style="padding: ${block.content.padding}px 30px; text-align: center; background-color: ${block.content.backgroundColor};">
        <h1 style="color: ${block.content.textColor}; margin: 0; font-size: ${block.content.fontSize}px; font-weight: bold;">${block.content.text}</h1>
      </td>
    </tr>`;

        case "text":
          const textContent = String(block.content.text || "").replace(/\n/g, "<br>");
          return `
    <tr>
      <td style="padding: ${block.content.padding}px 30px; background-color: ${block.content.backgroundColor || "#ffffff"};">
        <p style="color: ${block.content.textColor}; font-size: ${block.content.fontSize}px; line-height: 1.6; margin: 0; text-align: ${block.content.align};">${textContent}</p>
      </td>
    </tr>`;

        case "image":
          return `
    <tr>
      <td style="padding: ${block.content.padding || 20}px 30px; text-align: ${block.content.align || "center"};">
        <img src="${block.content.src}" alt="${block.content.alt || ""}" style="max-width: ${block.content.width || 100}%; height: auto; display: block; margin: 0 auto;" />
      </td>
    </tr>`;

        case "button":
          return `
    <tr>
      <td style="padding: ${block.content.padding || 20}px 30px; text-align: ${block.content.align || "center"};">
        <a href="${block.content.url || "#"}" style="display: inline-block; padding: 14px 32px; background-color: ${block.content.backgroundColor || "#BB292A"}; color: ${block.content.textColor || "#ffffff"}; text-decoration: none; border-radius: ${block.content.borderRadius || 6}px; font-weight: bold; font-size: ${block.content.fontSize || 16}px;">${block.content.text || "Botón"}</a>
      </td>
    </tr>`;

        case "divider":
          return `
    <tr>
      <td style="padding: 10px 30px;">
        <hr style="border: none; border-top: ${block.content.height}px solid ${block.content.color}; margin: 0;" />
      </td>
    </tr>`;

        case "spacer":
          return `
    <tr>
      <td style="height: ${block.content.height || 30}px;"></td>
    </tr>`;

        case "columns":
          const numColumns = parseInt(block.content.numColumns as string) || 2;
          const columnWidth = Math.floor(100 / numColumns);
          const columnsHtml = [];
          for (let i = 0; i < numColumns; i++) {
            const colType = block.content[`col${i}Type`] as string || "text";
            const colContent = block.content[`col${i}Content`] as string || "";
            const colImageUrl = block.content[`col${i}ImageUrl`] as string || "";
            const colLinkUrl = block.content[`col${i}LinkUrl`] as string || "";
            const colLinkText = block.content[`col${i}LinkText`] as string || "Enlace";
            const colFileUrl = block.content[`col${i}FileUrl`] as string || "";
            const colFileName = block.content[`col${i}FileName`] as string || "documento.pdf";
            const colFileExt = block.content[`col${i}FileExt`] as string || "PDF";

            let cellContent = "";
            switch (colType) {
              case "image":
                cellContent = colImageUrl ? `<img src="${colImageUrl}" alt="" style="max-width: 100%; height: auto; display: block;" />` : "<p style='color: #999;'>Sin imagen</p>";
                break;
              case "link":
                cellContent = `<a href="${colLinkUrl || "#"}" style="color: #BB292A; text-decoration: none;">${colLinkText}</a>`;
                break;
              case "file":
                cellContent = `<a href="${colFileUrl || "#"}" style="color: #333; text-decoration: none; display: flex; align-items: center; gap: 8px;"><span style="background: #BB292A; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">${colFileExt}</span>${colFileName}</a>`;
                break;
              default:
                cellContent = `<p style="margin: 0; color: #666666;">${colContent || "Columna " + (i + 1)}</p>`;
            }
            columnsHtml.push(`<td width="${columnWidth}%" style="vertical-align: top; padding: 0 ${i < numColumns - 1 ? "2%" : "0"} 0 ${i > 0 ? "2%" : "0"};">${cellContent}</td>`);
          }
          return `
    <tr>
      <td style="padding: 20px 30px;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            ${columnsHtml.join("\n            ")}
          </tr>
        </table>
      </td>
    </tr>`;

        case "social":
          const networks = ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok", "whatsapp"];
          const socialLinksHtml = networks
            .filter((network) => block.content[`${network}Url`])
            .map((network) => {
              const url = block.content[`${network}Url`] as string;
              const color = block.content.iconStyle === "colored" ? socialColors[network] : (block.content.iconColor as string || "#666666");
              return `<a href="${url}" style="display: inline-block; margin: 0 ${block.content.spacing || 8}px; text-decoration: none;" target="_blank">
                <div style="width: ${block.content.iconSize || 32}px; height: ${block.content.iconSize || 32}px; color: ${color};">
                  ${socialIcons[network as keyof typeof socialIcons].replace('width="24"', `width="${block.content.iconSize || 32}"`).replace('height="24"', `height="${block.content.iconSize || 32}"`).replace('currentColor', color)}
                </div>
              </a>`;
            })
            .join("");
          return `
    <tr>
      <td style="padding: ${block.content.padding || 20}px 30px; text-align: ${block.content.align || "center"}; background-color: ${block.content.backgroundColor || "#ffffff"};">
        ${socialLinksHtml}
      </td>
    </tr>`;

        case "link":
          return `
    <tr>
      <td style="padding: ${block.content.padding || 15}px 30px; background-color: ${block.content.backgroundColor || "#ffffff"};">
        <a href="${block.content.url || "#"}" style="color: ${block.content.textColor || "#BB292A"}; font-size: ${block.content.fontSize || 16}px; text-decoration: ${block.content.underline === "true" ? "underline" : "none"};" target="_blank">
          ${block.content.text || "Enlace"}
        </a>
        ${block.content.description ? `<p style="margin: 4px 0 0 0; color: #999999; font-size: 13px;">${block.content.description}</p>` : ""}
      </td>
    </tr>`;

        case "attachment":
          return `
    <tr>
      <td style="padding: ${block.content.padding || 15}px 30px; background-color: ${block.content.backgroundColor || "#f8f8f8"};">
        <table cellspacing="0" cellpadding="0" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 16px; background-color: #ffffff;">
              <table cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <div style="width: 40px; height: 40px; background-color: ${block.content.iconBgColor || "#BB292A"}; border-radius: 8px; text-align: center; line-height: 40px;">
                      <span style="color: #ffffff; font-size: 12px; font-weight: bold;">${block.content.fileExtension || "PDF"}</span>
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <a href="${block.content.url || "#"}" style="color: ${block.content.textColor || "#333333"}; font-size: ${block.content.fontSize || 14}px; font-weight: 500; text-decoration: none;" target="_blank">
                      ${block.content.fileName || "documento.pdf"}
                    </a>
                    ${block.content.fileSize ? `<p style="margin: 2px 0 0 0; color: #999999; font-size: 12px;">${block.content.fileSize}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

        case "footer":
          const footerLinks = [];
          if (block.content.link1Text && block.content.link1Url) {
            footerLinks.push(`<a href="${block.content.link1Url}" style="color: ${block.content.linkColor || "#666666"}; text-decoration: none;">${block.content.link1Text}</a>`);
          }
          if (block.content.link2Text && block.content.link2Url) {
            footerLinks.push(`<a href="${block.content.link2Url}" style="color: ${block.content.linkColor || "#666666"}; text-decoration: none;">${block.content.link2Text}</a>`);
          }
          if (block.content.link3Text && block.content.link3Url) {
            footerLinks.push(`<a href="${block.content.link3Url}" style="color: ${block.content.linkColor || "#666666"}; text-decoration: none;">${block.content.link3Text}</a>`);
          }
          const footerLinksHtml = footerLinks.length > 0 ? `<p style="margin: 0 0 10px 0; font-size: 12px;">${footerLinks.join(" | ")}</p>` : "";
          return `
    <tr>
      <td style="padding: ${block.content.padding || 30}px; background-color: ${block.content.backgroundColor || "#f8f8f8"}; text-align: center;">
        ${block.content.companyName ? `<p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: ${block.content.textColor || "#333333"};">${block.content.companyName}</p>` : ""}
        ${block.content.address ? `<p style="margin: 0 0 10px 0; font-size: 12px; color: ${block.content.textColor || "#666666"};">${block.content.address}</p>` : ""}
        ${footerLinksHtml}
        ${block.content.copyright ? `<p style="margin: 10px 0 0 0; font-size: 11px; color: ${block.content.copyrightColor || "#999999"};">${block.content.copyright}</p>` : ""}
        ${block.content.unsubscribeUrl ? `<p style="margin: 10px 0 0 0; font-size: 11px;"><a href="${block.content.unsubscribeUrl}" style="color: ${block.content.linkColor || "#666666"}; text-decoration: underline;">Darme de baja</a></p>` : ""}
      </td>
    </tr>`;

        case "unsubscribe":
          return `
    <tr>
      <td style="padding: ${block.content.padding || 20}px 30px; background-color: ${block.content.backgroundColor || "#f8f8f8"}; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: ${block.content.fontSize || 12}px; color: ${block.content.textColor || "#666666"};">
          ${block.content.text || "Si no deseas recibir más comunicaciones, puedes darte de baja."}
        </p>
        <a href="${block.content.unsubscribeUrl || "/api/unsubscribe?email={{email}}"}" style="color: ${block.content.linkColor || "#BB292A"}; font-size: ${block.content.fontSize || 12}px; text-decoration: underline;">
          ${block.content.linkText || "Darme de baja de esta lista"}
        </a>
      </td>
    </tr>`;

        default:
          return "";
      }
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
${bodyContent}
  </table>
</body>
</html>`;
}

export function TemplateForm({ template }: TemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "code" | "preview">("visual");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: template?.name || "",
    subject: template?.subject || "",
    text: template?.text || "",
  });

  const [blocks, setBlocks] = useState<EmailBlock[]>(() =>
    template?.html ? parseHtmlToBlocks(template.html) : defaultBlocks
  );

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [htmlCode, setHtmlCode] = useState(() => blocksToHtml(blocks));

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  function addBlock(type: BlockType) {
    const id = `${type}-${Date.now()}`;
    let newBlock: EmailBlock;

    switch (type) {
      case "header":
        newBlock = {
          id,
          type: "header",
          content: {
            text: "Título",
            backgroundColor: "#BB292A",
            textColor: "#ffffff",
            padding: "40",
            fontSize: "28",
          },
        };
        break;
      case "text":
        newBlock = {
          id,
          type: "text",
          content: {
            text: "Escribe tu texto aquí...",
            textColor: "#666666",
            fontSize: "16",
            align: "left",
            padding: "20",
            backgroundColor: "#ffffff",
          },
        };
        break;
      case "image":
        newBlock = {
          id,
          type: "image",
          content: {
            src: "",
            alt: "Imagen",
            width: "100",
            padding: "20",
            align: "center",
          },
        };
        break;
      case "button":
        newBlock = {
          id,
          type: "button",
          content: {
            text: "Click aquí",
            url: "https://",
            backgroundColor: "#BB292A",
            textColor: "#ffffff",
            padding: "20",
            align: "center",
            borderRadius: "6",
            fontSize: "16",
          },
        };
        break;
      case "divider":
        newBlock = {
          id,
          type: "divider",
          content: {
            color: "#eeeeee",
            height: "1",
          },
        };
        break;
      case "spacer":
        newBlock = {
          id,
          type: "spacer",
          content: {
            height: "30",
          },
        };
        break;
      case "columns":
        newBlock = {
          id,
          type: "columns",
          content: {
            numColumns: "2",
            col0Type: "text",
            col0Content: "Columna 1",
            col1Type: "text",
            col1Content: "Columna 2",
            col2Type: "text",
            col2Content: "Columna 3",
            col3Type: "text",
            col3Content: "Columna 4",
          },
        };
        break;
      case "social":
        newBlock = {
          id,
          type: "social",
          content: {
            facebookUrl: "",
            instagramUrl: "",
            twitterUrl: "",
            linkedinUrl: "",
            youtubeUrl: "",
            tiktokUrl: "",
            whatsappUrl: "",
            iconSize: "32",
            iconStyle: "colored",
            iconColor: "#666666",
            spacing: "8",
            padding: "20",
            align: "center",
            backgroundColor: "#ffffff",
          },
        };
        break;
      case "link":
        newBlock = {
          id,
          type: "link",
          content: {
            text: "Ver más información",
            url: "https://",
            description: "",
            textColor: "#BB292A",
            fontSize: "16",
            underline: "false",
            padding: "15",
            backgroundColor: "#ffffff",
          },
        };
        break;
      case "attachment":
        newBlock = {
          id,
          type: "attachment",
          content: {
            fileName: "documento.pdf",
            url: "https://",
            fileSize: "",
            fileExtension: "PDF",
            textColor: "#333333",
            fontSize: "14",
            iconBgColor: "#BB292A",
            padding: "15",
            backgroundColor: "#f8f8f8",
          },
        };
        break;
      case "footer":
        newBlock = {
          id,
          type: "footer",
          content: {
            companyName: "Cerecilla SL",
            address: "Calle Lope de Vega 10 Esc Izq 4º6ª, 08005 Barcelona",
            copyright: `© ${new Date().getFullYear()} Cerecilla SL. Todos los derechos reservados.`,
            link1Text: "Política de privacidad",
            link1Url: "/politica-privacidad",
            link2Text: "Términos y condiciones",
            link2Url: "/terminos-condiciones",
            link3Text: "LOPD",
            link3Url: "/lopd",
            unsubscribeUrl: "",
            backgroundColor: "#f8f8f8",
            textColor: "#666666",
            linkColor: "#BB292A",
            copyrightColor: "#999999",
            padding: "30",
          },
        };
        break;
      case "unsubscribe":
        newBlock = {
          id,
          type: "unsubscribe",
          content: {
            text: "Si no deseas recibir más comunicaciones de Cerecilla, puedes darte de baja.",
            linkText: "Darme de baja de esta lista",
            unsubscribeUrl: "/api/unsubscribe?email={{email}}",
            backgroundColor: "#f8f8f8",
            textColor: "#666666",
            linkColor: "#BB292A",
            fontSize: "12",
            padding: "20",
          },
        };
        break;
      default:
        return;
    }

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    setHtmlCode(blocksToHtml(newBlocks));
    setSelectedBlockId(id);
  }

  function updateBlock(id: string, content: Record<string, string | number>) {
    const newBlocks = blocks.map((b) =>
      b.id === id ? { ...b, content: { ...b.content, ...content } } : b
    );
    setBlocks(newBlocks);
    setHtmlCode(blocksToHtml(newBlocks));
  }

  function deleteBlock(id: string) {
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);
    setHtmlCode(blocksToHtml(newBlocks));
    setSelectedBlockId(null);
  }

  function moveBlock(id: string, direction: "up" | "down") {
    const index = blocks.findIndex((b) => b.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
    setHtmlCode(blocksToHtml(newBlocks));
  }

  async function uploadFile(file: File): Promise<{ url: string; name: string; extension: string; size: string } | null> {
    setUploading(true);
    try {
      const supabase = createClient();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("email-assets")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError("Error al subir el archivo");
        return null;
      }

      const { data } = supabase.storage.from("email-assets").getPublicUrl(filePath);

      // Get file extension
      const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
      // Format file size
      const sizeBytes = file.size;
      let sizeStr = "";
      if (sizeBytes < 1024) {
        sizeStr = `${sizeBytes} B`;
      } else if (sizeBytes < 1024 * 1024) {
        sizeStr = `${(sizeBytes / 1024).toFixed(1)} KB`;
      } else {
        sizeStr = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
      }

      return {
        url: data.publicUrl,
        name: file.name,
        extension: ext,
        size: sizeStr,
      };
    } catch (err) {
      console.error("Upload error:", err);
      setError("Error al subir el archivo");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    const result = await uploadFile(file);
    return result?.url || null;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, blockId: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url) {
      updateBlock(blockId, { src: url });
    }
  }

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>, blockId: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadFile(file);
    if (result) {
      updateBlock(blockId, {
        url: result.url,
        fileName: result.name,
        fileExtension: result.extension,
        fileSize: result.size,
      });
    }
  }

  function handleDocumentDrop(e: React.DragEvent<HTMLLabelElement>, blockId: string) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file).then((result) => {
        if (result) {
          updateBlock(blockId, {
            url: result.url,
            fileName: result.name,
            fileExtension: result.extension,
            fileSize: result.size,
          });
        }
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const finalHtml = viewMode === "code" ? htmlCode : blocksToHtml(blocks);

    const data: TemplateFormData = {
      name: formData.name,
      subject: formData.subject,
      html: finalHtml,
      text: formData.text,
    };

    const result = template
      ? await updateTemplate(template.id, data)
      : await createTemplate(data);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const blockTypes = [
    { type: "header" as BlockType, icon: Type, label: "Cabecera" },
    { type: "text" as BlockType, icon: AlignLeft, label: "Texto" },
    { type: "image" as BlockType, icon: ImageIcon, label: "Imagen" },
    { type: "button" as BlockType, icon: Square, label: "Botón" },
    { type: "link" as BlockType, icon: ExternalLink, label: "Enlace" },
    { type: "attachment" as BlockType, icon: Paperclip, label: "Documento" },
    { type: "divider" as BlockType, icon: Minus, label: "Separador" },
    { type: "spacer" as BlockType, icon: ChevronDown, label: "Espacio" },
    { type: "columns" as BlockType, icon: Columns, label: "Columnas" },
    { type: "social" as BlockType, icon: Share2, label: "Redes Sociales" },
    { type: "footer" as BlockType, icon: LayoutPanelTop, label: "Pie de página" },
    { type: "unsubscribe" as BlockType, icon: UserMinus, label: "Baja" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la plantilla *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            placeholder="ej: welcome-email"
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Asunto del email *
          </label>
          <input
            id="subject"
            type="text"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            placeholder="ej: Bienvenido a Cerecilla"
          />
        </div>
      </div>

      {/* View mode tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setViewMode("visual")}
          className={`px-4 py-2 text-sm rounded-md flex items-center gap-2 transition-colors ${
            viewMode === "visual"
              ? "bg-white shadow text-gray-900 font-medium"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Palette className="w-4 h-4" />
          Visual
        </button>
        <button
          type="button"
          onClick={() => setViewMode("code")}
          className={`px-4 py-2 text-sm rounded-md flex items-center gap-2 transition-colors ${
            viewMode === "code"
              ? "bg-white shadow text-gray-900 font-medium"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Code className="w-4 h-4" />
          Código
        </button>
        <button
          type="button"
          onClick={() => setViewMode("preview")}
          className={`px-4 py-2 text-sm rounded-md flex items-center gap-2 transition-colors ${
            viewMode === "preview"
              ? "bg-white shadow text-gray-900 font-medium"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
      </div>

      {/* Editor area */}
      {viewMode === "visual" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Block palette */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Añadir bloque</h3>
              <div className="grid grid-cols-2 gap-2">
                {blockTypes.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addBlock(type)}
                    className="flex flex-col items-center gap-1 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#BB292A] hover:bg-red-50 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Block editor */}
            {selectedBlock && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Editar {blockTypes.find((b) => b.type === selectedBlock.type)?.label}
                </h3>
                <div className="space-y-3">
                  {selectedBlock.type === "header" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Texto</label>
                        <input
                          type="text"
                          value={selectedBlock.content.text as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color fondo</label>
                          <input
                            type="color"
                            value={selectedBlock.content.backgroundColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { backgroundColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color texto</label>
                          <input
                            type="color"
                            value={selectedBlock.content.textColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { textColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Tamaño texto (px)</label>
                        <input
                          type="number"
                          value={selectedBlock.content.fontSize as number}
                          onChange={(e) => updateBlock(selectedBlock.id, { fontSize: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "text" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Texto</label>
                        <textarea
                          rows={4}
                          value={selectedBlock.content.text as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color texto</label>
                          <input
                            type="color"
                            value={selectedBlock.content.textColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { textColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tamaño (px)</label>
                          <input
                            type="number"
                            value={selectedBlock.content.fontSize as number}
                            onChange={(e) => updateBlock(selectedBlock.id, { fontSize: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Alineación</label>
                        <div className="flex gap-1">
                          {["left", "center", "right"].map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => updateBlock(selectedBlock.id, { align })}
                              className={`flex-1 p-2 border rounded ${
                                selectedBlock.content.align === align
                                  ? "border-[#BB292A] bg-red-50"
                                  : "border-gray-300"
                              }`}
                            >
                              {align === "left" && <AlignLeft className="w-4 h-4 mx-auto" />}
                              {align === "center" && <AlignCenter className="w-4 h-4 mx-auto" />}
                              {align === "right" && <AlignRight className="w-4 h-4 mx-auto" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "image" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Imagen</label>
                        {selectedBlock.content.src ? (
                          <div className="relative">
                            <img
                              src={selectedBlock.content.src as string}
                              alt=""
                              className="w-full h-24 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => updateBlock(selectedBlock.id, { src: "" })}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#BB292A]">
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">
                              {uploading ? "Subiendo..." : "Subir imagen"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, selectedBlock.id)}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">O URL directa</label>
                        <input
                          type="url"
                          value={selectedBlock.content.src as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { src: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Ancho (%)</label>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          value={selectedBlock.content.width as number}
                          onChange={(e) => updateBlock(selectedBlock.id, { width: e.target.value })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">{selectedBlock.content.width}%</span>
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "button" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Texto del botón</label>
                        <input
                          type="text"
                          value={selectedBlock.content.text as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">URL</label>
                        <input
                          type="url"
                          value={selectedBlock.content.url as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color botón</label>
                          <input
                            type="color"
                            value={selectedBlock.content.backgroundColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { backgroundColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color texto</label>
                          <input
                            type="color"
                            value={selectedBlock.content.textColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { textColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "divider" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Color</label>
                        <input
                          type="color"
                          value={selectedBlock.content.color as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                          className="w-full h-8 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Grosor (px)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={selectedBlock.content.height as number}
                          onChange={(e) => updateBlock(selectedBlock.id, { height: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === "spacer" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Altura (px)</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={selectedBlock.content.height as number}
                        onChange={(e) => updateBlock(selectedBlock.id, { height: e.target.value })}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{selectedBlock.content.height}px</span>
                    </div>
                  )}

                  {selectedBlock.type === "columns" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Número de columnas</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => updateBlock(selectedBlock.id, { numColumns: String(num) })}
                              className={`flex-1 p-2 border rounded text-sm font-medium ${
                                parseInt(selectedBlock.content.numColumns as string) === num
                                  ? "border-[#BB292A] bg-red-50 text-[#BB292A]"
                                  : "border-gray-300"
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                      {Array.from({ length: parseInt(selectedBlock.content.numColumns as string) || 2 }).map((_, i) => (
                        <div key={i} className="pt-2 border-t">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Columna {i + 1}</label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Tipo de contenido</label>
                              <select
                                value={selectedBlock.content[`col${i}Type`] as string || "text"}
                                onChange={(e) => updateBlock(selectedBlock.id, { [`col${i}Type`]: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                              >
                                <option value="text">Texto</option>
                                <option value="image">Imagen</option>
                                <option value="link">Enlace</option>
                                <option value="file">Archivo</option>
                              </select>
                            </div>
                            {(selectedBlock.content[`col${i}Type`] as string || "text") === "text" && (
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Texto</label>
                                <textarea
                                  rows={2}
                                  value={selectedBlock.content[`col${i}Content`] as string || ""}
                                  onChange={(e) => updateBlock(selectedBlock.id, { [`col${i}Content`]: e.target.value })}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                />
                              </div>
                            )}
                            {(selectedBlock.content[`col${i}Type`] as string) === "image" && (
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">URL de imagen</label>
                                <input
                                  type="url"
                                  value={selectedBlock.content[`col${i}ImageUrl`] as string || ""}
                                  onChange={(e) => updateBlock(selectedBlock.id, { [`col${i}ImageUrl`]: e.target.value })}
                                  placeholder="https://..."
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                />
                              </div>
                            )}
                            {(selectedBlock.content[`col${i}Type`] as string) === "link" && (
                              <>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Texto del enlace</label>
                                  <input
                                    type="text"
                                    value={selectedBlock.content[`col${i}LinkText`] as string || ""}
                                    onChange={(e) => updateBlock(selectedBlock.id, { [`col${i}LinkText`]: e.target.value })}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">URL</label>
                                  <input
                                    type="url"
                                    value={selectedBlock.content[`col${i}LinkUrl`] as string || ""}
                                    onChange={(e) => updateBlock(selectedBlock.id, { [`col${i}LinkUrl`]: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                              </>
                            )}
                            {(selectedBlock.content[`col${i}Type`] as string) === "file" && (
                              <>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Nombre del archivo</label>
                                  <input
                                    type="text"
                                    value={selectedBlock.content[`col${i}FileName`] as string || ""}
                                    onChange={(e) => updateBlock(selectedBlock.id, { [`col${i}FileName`]: e.target.value })}
                                    placeholder="documento.pdf"
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Extensión</label>
                                    <select
                                      value={selectedBlock.content[`col${i}FileExt`] as string || "PDF"}
                                      onChange={(e) => updateBlock(selectedBlock.id, { [`col${i}FileExt`]: e.target.value })}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                    >
                                      <option value="PDF">PDF</option>
                                      <option value="DOC">DOC</option>
                                      <option value="XLS">XLS</option>
                                      <option value="PPT">PPT</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">URL</label>
                                    <input
                                      type="url"
                                      value={selectedBlock.content[`col${i}FileUrl`] as string || ""}
                                      onChange={(e) => updateBlock(selectedBlock.id, { [`col${i}FileUrl`]: e.target.value })}
                                      placeholder="https://..."
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {selectedBlock.type === "social" && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700">URLs de Redes Sociales</label>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Facebook</label>
                          <input
                            type="url"
                            value={selectedBlock.content.facebookUrl as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { facebookUrl: e.target.value })}
                            placeholder="https://facebook.com/..."
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Instagram</label>
                          <input
                            type="url"
                            value={selectedBlock.content.instagramUrl as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { instagramUrl: e.target.value })}
                            placeholder="https://instagram.com/..."
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">X (Twitter)</label>
                          <input
                            type="url"
                            value={selectedBlock.content.twitterUrl as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { twitterUrl: e.target.value })}
                            placeholder="https://x.com/..."
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">LinkedIn</label>
                          <input
                            type="url"
                            value={selectedBlock.content.linkedinUrl as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { linkedinUrl: e.target.value })}
                            placeholder="https://linkedin.com/..."
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">YouTube</label>
                          <input
                            type="url"
                            value={selectedBlock.content.youtubeUrl as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { youtubeUrl: e.target.value })}
                            placeholder="https://youtube.com/..."
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">TikTok</label>
                          <input
                            type="url"
                            value={selectedBlock.content.tiktokUrl as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { tiktokUrl: e.target.value })}
                            placeholder="https://tiktok.com/..."
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">WhatsApp</label>
                          <input
                            type="url"
                            value={selectedBlock.content.whatsappUrl as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { whatsappUrl: e.target.value })}
                            placeholder="https://wa.me/34..."
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Estilo de iconos</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateBlock(selectedBlock.id, { iconStyle: "colored" })}
                            className={`flex-1 px-3 py-2 text-xs rounded border ${
                              selectedBlock.content.iconStyle === "colored"
                                ? "border-[#BB292A] bg-red-50 text-[#BB292A]"
                                : "border-gray-300"
                            }`}
                          >
                            Colores
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBlock(selectedBlock.id, { iconStyle: "mono" })}
                            className={`flex-1 px-3 py-2 text-xs rounded border ${
                              selectedBlock.content.iconStyle === "mono"
                                ? "border-[#BB292A] bg-red-50 text-[#BB292A]"
                                : "border-gray-300"
                            }`}
                          >
                            Monocolor
                          </button>
                        </div>
                      </div>
                      {selectedBlock.content.iconStyle === "mono" && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color de iconos</label>
                          <input
                            type="color"
                            value={selectedBlock.content.iconColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { iconColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tamaño (px)</label>
                          <input
                            type="number"
                            min="16"
                            max="64"
                            value={selectedBlock.content.iconSize as number}
                            onChange={(e) => updateBlock(selectedBlock.id, { iconSize: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Espaciado (px)</label>
                          <input
                            type="number"
                            min="0"
                            max="32"
                            value={selectedBlock.content.spacing as number}
                            onChange={(e) => updateBlock(selectedBlock.id, { spacing: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Color fondo</label>
                        <input
                          type="color"
                          value={selectedBlock.content.backgroundColor as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { backgroundColor: e.target.value })}
                          className="w-full h-8 rounded cursor-pointer"
                        />
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "link" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Texto del enlace</label>
                        <input
                          type="text"
                          value={selectedBlock.content.text as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">URL *</label>
                        <input
                          type="url"
                          value={selectedBlock.content.url as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Descripción (opcional)</label>
                        <input
                          type="text"
                          value={selectedBlock.content.description as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { description: e.target.value })}
                          placeholder="Descripción breve del enlace..."
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color enlace</label>
                          <input
                            type="color"
                            value={selectedBlock.content.textColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { textColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tamaño (px)</label>
                          <input
                            type="number"
                            value={selectedBlock.content.fontSize as number}
                            onChange={(e) => updateBlock(selectedBlock.id, { fontSize: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBlock.content.underline === "true"}
                            onChange={(e) => updateBlock(selectedBlock.id, { underline: e.target.checked ? "true" : "false" })}
                            className="rounded border-gray-300"
                          />
                          <span className="text-xs text-gray-600">Subrayar enlace</span>
                        </label>
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "attachment" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Subir documento</label>
                        {selectedBlock.content.url ? (
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: selectedBlock.content.iconBgColor as string || "#BB292A" }}
                              >
                                {selectedBlock.content.fileExtension as string || "PDF"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{selectedBlock.content.fileName as string}</p>
                                <p className="text-xs text-gray-500">{selectedBlock.content.fileSize as string}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateBlock(selectedBlock.id, { url: "", fileName: "documento.pdf", fileSize: "", fileExtension: "PDF" })}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label
                            className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#BB292A] hover:bg-red-50/30 transition-colors"
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => handleDocumentDrop(e, selectedBlock.id)}
                          >
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600 font-medium">
                              {uploading ? "Subiendo..." : "Arrastra un archivo aquí"}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">o haz clic para seleccionar</span>
                            <span className="text-xs text-gray-400 mt-2">PDF, Word, Excel, PowerPoint...</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv"
                              onChange={(e) => handleDocumentUpload(e, selectedBlock.id)}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 text-center">— o introduce los datos manualmente —</div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nombre del archivo</label>
                        <input
                          type="text"
                          value={selectedBlock.content.fileName as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { fileName: e.target.value })}
                          placeholder="documento.pdf"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">URL del archivo</label>
                        <input
                          type="url"
                          value={selectedBlock.content.url as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Extensión</label>
                          <select
                            value={selectedBlock.content.fileExtension as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { fileExtension: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          >
                            <option value="PDF">PDF</option>
                            <option value="DOC">DOC</option>
                            <option value="DOCX">DOCX</option>
                            <option value="XLS">XLS</option>
                            <option value="XLSX">XLSX</option>
                            <option value="PPT">PPT</option>
                            <option value="PPTX">PPTX</option>
                            <option value="ZIP">ZIP</option>
                            <option value="TXT">TXT</option>
                            <option value="CSV">CSV</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tamaño</label>
                          <input
                            type="text"
                            value={selectedBlock.content.fileSize as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { fileSize: e.target.value })}
                            placeholder="2.5 MB"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color icono</label>
                          <input
                            type="color"
                            value={selectedBlock.content.iconBgColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { iconBgColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color fondo</label>
                          <input
                            type="color"
                            value={selectedBlock.content.backgroundColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { backgroundColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "footer" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nombre de empresa</label>
                        <input
                          type="text"
                          value={selectedBlock.content.companyName as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { companyName: e.target.value })}
                          placeholder="Mi Empresa SL"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Dirección</label>
                        <input
                          type="text"
                          value={selectedBlock.content.address as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { address: e.target.value })}
                          placeholder="Calle, Ciudad, CP"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Copyright</label>
                        <input
                          type="text"
                          value={selectedBlock.content.copyright as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { copyright: e.target.value })}
                          placeholder="© 2025 Mi Empresa..."
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="pt-2 border-t">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Enlaces del footer</label>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="text"
                              value={selectedBlock.content.link1Text as string}
                              onChange={(e) => updateBlock(selectedBlock.id, { link1Text: e.target.value })}
                              placeholder="Texto enlace 1"
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                            <input
                              type="url"
                              value={selectedBlock.content.link1Url as string}
                              onChange={(e) => updateBlock(selectedBlock.id, { link1Url: e.target.value })}
                              placeholder="URL"
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="text"
                              value={selectedBlock.content.link2Text as string}
                              onChange={(e) => updateBlock(selectedBlock.id, { link2Text: e.target.value })}
                              placeholder="Texto enlace 2"
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                            <input
                              type="url"
                              value={selectedBlock.content.link2Url as string}
                              onChange={(e) => updateBlock(selectedBlock.id, { link2Url: e.target.value })}
                              placeholder="URL"
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="text"
                              value={selectedBlock.content.link3Text as string}
                              onChange={(e) => updateBlock(selectedBlock.id, { link3Text: e.target.value })}
                              placeholder="Texto enlace 3"
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                            <input
                              type="url"
                              value={selectedBlock.content.link3Url as string}
                              onChange={(e) => updateBlock(selectedBlock.id, { link3Url: e.target.value })}
                              placeholder="URL"
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">URL darse de baja (opcional)</label>
                        <input
                          type="url"
                          value={selectedBlock.content.unsubscribeUrl as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { unsubscribeUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color fondo</label>
                          <input
                            type="color"
                            value={selectedBlock.content.backgroundColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { backgroundColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color enlaces</label>
                          <input
                            type="color"
                            value={selectedBlock.content.linkColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { linkColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "unsubscribe" && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Texto explicativo</label>
                        <textarea
                          rows={2}
                          value={selectedBlock.content.text as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          placeholder="Si no deseas recibir más comunicaciones..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Texto del enlace</label>
                        <input
                          type="text"
                          value={selectedBlock.content.linkText as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { linkText: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          placeholder="Darme de baja"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">URL de baja (usa {"{{email}}"} para el email)</label>
                        <input
                          type="text"
                          value={selectedBlock.content.unsubscribeUrl as string}
                          onChange={(e) => updateBlock(selectedBlock.id, { unsubscribeUrl: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                          placeholder="/api/unsubscribe?email={{email}}"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color fondo</label>
                          <input
                            type="color"
                            value={selectedBlock.content.backgroundColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { backgroundColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color enlace</label>
                          <input
                            type="color"
                            value={selectedBlock.content.linkColor as string}
                            onChange={(e) => updateBlock(selectedBlock.id, { linkColor: e.target.value })}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteBlock(selectedBlock.id)}
                    className="w-full mt-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar bloque
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Visual preview */}
          <div className="lg:col-span-3">
            <div className="bg-gray-200 rounded-lg p-4 min-h-[500px]">
              <div className="bg-white max-w-[600px] mx-auto shadow-lg">
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`relative group cursor-pointer ${
                      selectedBlockId === block.id ? "ring-2 ring-[#BB292A]" : ""
                    }`}
                  >
                    {/* Block controls */}
                    <div
                      className={`absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 ${
                        selectedBlockId === block.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      } transition-opacity`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, "up");
                        }}
                        disabled={index === 0}
                        className="p-1 bg-white border rounded shadow hover:bg-gray-50 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, "down");
                        }}
                        disabled={index === blocks.length - 1}
                        className="p-1 bg-white border rounded shadow hover:bg-gray-50 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBlock(block.id);
                        }}
                        className="p-1 bg-white border rounded shadow hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Block preview */}
                    {block.type === "header" && (
                      <div
                        style={{
                          backgroundColor: block.content.backgroundColor as string,
                          padding: `${block.content.padding}px 30px`,
                          textAlign: "center",
                        }}
                      >
                        <h1
                          style={{
                            color: block.content.textColor as string,
                            fontSize: `${block.content.fontSize}px`,
                            margin: 0,
                            fontWeight: "bold",
                          }}
                        >
                          {block.content.text as string}
                        </h1>
                      </div>
                    )}

                    {block.type === "text" && (
                      <div
                        style={{
                          backgroundColor: (block.content.backgroundColor as string) || "#ffffff",
                          padding: `${block.content.padding}px 30px`,
                        }}
                      >
                        <p
                          style={{
                            color: block.content.textColor as string,
                            fontSize: `${block.content.fontSize}px`,
                            lineHeight: 1.6,
                            margin: 0,
                            textAlign: block.content.align as "left" | "center" | "right",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {block.content.text as string}
                        </p>
                      </div>
                    )}

                    {block.type === "image" && (
                      <div style={{ padding: `${block.content.padding || 20}px 30px`, textAlign: (block.content.align as "left" | "center" | "right") || "center" }}>
                        {block.content.src ? (
                          <img
                            src={block.content.src as string}
                            alt={block.content.alt as string}
                            style={{ maxWidth: `${block.content.width}%`, height: "auto", display: "inline-block" }}
                          />
                        ) : (
                          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <span className="text-sm text-gray-500">Selecciona para añadir imagen</span>
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === "button" && (
                      <div style={{ padding: `${block.content.padding || 20}px 30px`, textAlign: (block.content.align as "left" | "center" | "right") || "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "14px 32px",
                            backgroundColor: block.content.backgroundColor as string,
                            color: block.content.textColor as string,
                            borderRadius: `${block.content.borderRadius}px`,
                            fontWeight: "bold",
                            fontSize: `${block.content.fontSize}px`,
                            textDecoration: "none",
                          }}
                        >
                          {block.content.text as string}
                        </span>
                      </div>
                    )}

                    {block.type === "divider" && (
                      <div style={{ padding: "10px 30px" }}>
                        <hr
                          style={{
                            border: "none",
                            borderTop: `${block.content.height}px solid ${block.content.color}`,
                            margin: 0,
                          }}
                        />
                      </div>
                    )}

                    {block.type === "spacer" && (
                      <div style={{ height: `${block.content.height}px`, backgroundColor: "#f9f9f9" }}>
                        <div className="h-full flex items-center justify-center text-xs text-gray-400">
                          {block.content.height}px
                        </div>
                      </div>
                    )}

                    {block.type === "columns" && (
                      <div style={{ padding: "20px 30px" }}>
                        <table width="100%" cellSpacing={0} cellPadding={0}>
                          <tbody>
                            <tr>
                              {Array.from({ length: parseInt(block.content.numColumns as string) || 2 }).map((_, i) => {
                                const colType = block.content[`col${i}Type`] as string || "text";
                                const colContent = block.content[`col${i}Content`] as string || `Columna ${i + 1}`;
                                const colImageUrl = block.content[`col${i}ImageUrl`] as string || "";
                                const colLinkText = block.content[`col${i}LinkText`] as string || "Enlace";
                                const colFileName = block.content[`col${i}FileName`] as string || "documento.pdf";
                                const colFileExt = block.content[`col${i}FileExt`] as string || "PDF";
                                const numCols = parseInt(block.content.numColumns as string) || 2;

                                return (
                                  <td
                                    key={i}
                                    width={`${Math.floor(100 / numCols)}%`}
                                    style={{ verticalAlign: "top", padding: `0 ${i < numCols - 1 ? "2%" : "0"} 0 ${i > 0 ? "2%" : "0"}` }}
                                  >
                                    {colType === "text" && <p style={{ margin: 0, color: "#666666" }}>{colContent}</p>}
                                    {colType === "image" && (colImageUrl ? <img src={colImageUrl} alt="" style={{ maxWidth: "100%", height: "auto" }} /> : <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-4 text-center text-xs text-gray-400">Sin imagen</div>)}
                                    {colType === "link" && <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#BB292A", textDecoration: "none" }}>{colLinkText}</a>}
                                    {colType === "file" && (
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ background: "#BB292A", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" }}>{colFileExt}</span>
                                        <span style={{ color: "#333" }}>{colFileName}</span>
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {block.type === "social" && (
                      <div
                        style={{
                          padding: `${block.content.padding || 20}px 30px`,
                          textAlign: (block.content.align as "left" | "center" | "right") || "center",
                          backgroundColor: (block.content.backgroundColor as string) || "#ffffff",
                        }}
                      >
                        {["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok", "whatsapp"].some(
                          (network) => block.content[`${network}Url`]
                        ) ? (
                          <div style={{ display: "inline-flex", gap: `${block.content.spacing || 8}px` }}>
                            {["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok", "whatsapp"]
                              .filter((network) => block.content[`${network}Url`])
                              .map((network) => {
                                const color =
                                  block.content.iconStyle === "colored"
                                    ? socialColors[network]
                                    : (block.content.iconColor as string) || "#666666";
                                return (
                                  <div
                                    key={network}
                                    style={{
                                      width: `${block.content.iconSize || 32}px`,
                                      height: `${block.content.iconSize || 32}px`,
                                      color: color,
                                    }}
                                    dangerouslySetInnerHTML={{
                                      __html: socialIcons[network as keyof typeof socialIcons]
                                        .replace('width="24"', `width="${block.content.iconSize || 32}"`)
                                        .replace('height="24"', `height="${block.content.iconSize || 32}"`)
                                        .replace(/currentColor/g, color),
                                    }}
                                  />
                                );
                              })}
                          </div>
                        ) : (
                          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Share2 className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                            <span className="text-sm text-gray-500">Añade URLs de redes sociales</span>
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === "link" && (
                      <div
                        style={{
                          padding: `${block.content.padding || 15}px 30px`,
                          backgroundColor: (block.content.backgroundColor as string) || "#ffffff",
                        }}
                      >
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          style={{
                            color: (block.content.textColor as string) || "#BB292A",
                            fontSize: `${block.content.fontSize || 16}px`,
                            textDecoration: block.content.underline === "true" ? "underline" : "none",
                          }}
                        >
                          {(block.content.text as string) || "Enlace"}
                        </a>
                        {block.content.description && (
                          <p style={{ margin: "4px 0 0 0", color: "#999999", fontSize: "13px" }}>
                            {block.content.description as string}
                          </p>
                        )}
                      </div>
                    )}

                    {block.type === "attachment" && (
                      <div
                        style={{
                          padding: `${block.content.padding || 15}px 30px`,
                          backgroundColor: (block.content.backgroundColor as string) || "#f8f8f8",
                        }}
                      >
                        <div
                          style={{
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            overflow: "hidden",
                            display: "inline-block",
                          }}
                        >
                          <div
                            style={{
                              padding: "12px 16px",
                              backgroundColor: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                backgroundColor: (block.content.iconBgColor as string) || "#BB292A",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <span style={{ color: "#ffffff", fontSize: "12px", fontWeight: "bold" }}>
                                {(block.content.fileExtension as string) || "PDF"}
                              </span>
                            </div>
                            <div>
                              <a
                                href="#"
                                onClick={(e) => e.preventDefault()}
                                style={{
                                  color: (block.content.textColor as string) || "#333333",
                                  fontSize: `${block.content.fontSize || 14}px`,
                                  fontWeight: 500,
                                  textDecoration: "none",
                                }}
                              >
                                {(block.content.fileName as string) || "documento.pdf"}
                              </a>
                              {block.content.fileSize && (
                                <p style={{ margin: "2px 0 0 0", color: "#999999", fontSize: "12px" }}>
                                  {block.content.fileSize as string}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === "footer" && (
                      <div
                        style={{
                          padding: `${block.content.padding || 30}px`,
                          backgroundColor: (block.content.backgroundColor as string) || "#f8f8f8",
                          textAlign: "center",
                        }}
                      >
                        {block.content.companyName && (
                          <p style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: 600, color: (block.content.textColor as string) || "#333333" }}>
                            {block.content.companyName as string}
                          </p>
                        )}
                        {block.content.address && (
                          <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: (block.content.textColor as string) || "#666666" }}>
                            {block.content.address as string}
                          </p>
                        )}
                        {(block.content.link1Text || block.content.link2Text || block.content.link3Text) && (
                          <p style={{ margin: "0 0 10px 0", fontSize: "12px" }}>
                            {[
                              block.content.link1Text && (
                                <a key="l1" href="#" onClick={(e) => e.preventDefault()} style={{ color: (block.content.linkColor as string) || "#666666", textDecoration: "none" }}>
                                  {block.content.link1Text as string}
                                </a>
                              ),
                              block.content.link2Text && (
                                <a key="l2" href="#" onClick={(e) => e.preventDefault()} style={{ color: (block.content.linkColor as string) || "#666666", textDecoration: "none" }}>
                                  {block.content.link2Text as string}
                                </a>
                              ),
                              block.content.link3Text && (
                                <a key="l3" href="#" onClick={(e) => e.preventDefault()} style={{ color: (block.content.linkColor as string) || "#666666", textDecoration: "none" }}>
                                  {block.content.link3Text as string}
                                </a>
                              ),
                            ]
                              .filter(Boolean)
                              .map((link, i, arr) => (
                                <span key={i}>
                                  {link}
                                  {i < arr.length - 1 && " | "}
                                </span>
                              ))}
                          </p>
                        )}
                        {block.content.copyright && (
                          <p style={{ margin: "10px 0 0 0", fontSize: "11px", color: (block.content.copyrightColor as string) || "#999999" }}>
                            {block.content.copyright as string}
                          </p>
                        )}
                        {block.content.unsubscribeUrl && (
                          <p style={{ margin: "10px 0 0 0", fontSize: "11px" }}>
                            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: (block.content.linkColor as string) || "#666666", textDecoration: "underline" }}>
                              Darme de baja
                            </a>
                          </p>
                        )}
                      </div>
                    )}

                    {block.type === "unsubscribe" && (
                      <div
                        style={{
                          padding: `${block.content.padding || 20}px 30px`,
                          backgroundColor: (block.content.backgroundColor as string) || "#f8f8f8",
                          textAlign: "center",
                        }}
                      >
                        <p style={{ margin: "0 0 10px 0", fontSize: `${block.content.fontSize || 12}px`, color: (block.content.textColor as string) || "#666666" }}>
                          {(block.content.text as string) || "Si no deseas recibir más comunicaciones, puedes darte de baja."}
                        </p>
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          style={{ color: (block.content.linkColor as string) || "#BB292A", fontSize: `${block.content.fontSize || 12}px`, textDecoration: "underline" }}
                        >
                          {(block.content.linkText as string) || "Darme de baja de esta lista"}
                        </a>
                      </div>
                    )}
                  </div>
                ))}

                {blocks.length === 0 && (
                  <div className="p-12 text-center text-gray-400">
                    <p>Añade bloques desde el panel izquierdo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "code" && (
        <textarea
          rows={24}
          value={htmlCode}
          onChange={(e) => setHtmlCode(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent font-mono text-sm"
          placeholder="<html>...</html>"
        />
      )}

      {viewMode === "preview" && (
        <div className="bg-gray-200 rounded-lg p-4">
          <iframe
            srcDoc={blocksToHtml(blocks)}
            className="w-full h-[600px] bg-white max-w-[600px] mx-auto shadow-lg"
            title="Email preview"
          />
        </div>
      )}

      {/* Text version */}
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
          Versión texto plano (opcional)
        </label>
        <textarea
          id="text"
          rows={4}
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent font-mono text-sm"
          placeholder="Versión sin formato HTML para clientes de correo antiguos..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {template ? "Guardar cambios" : "Crear plantilla"}
        </button>
      </div>
    </form>
  );
}
