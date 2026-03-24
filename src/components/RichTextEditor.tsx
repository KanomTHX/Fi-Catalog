import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Palette, Type, Smile } from "lucide-react";
import { useEffect, useState } from "react";

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const COLORS = ["#000000", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#ffffff"];
const EMOJIS = ["😊", "👍", "❤️", "🔥", "⭐", "✅", "🎉", "💯", "🏠", "🛋️", "🪑", "🛏️", "📦", "🚚", "💰", "🏷️", "✨", "🆕", "🔖", "📌"];

// Custom font-size extension
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (el) => el.style.fontSize || null,
        renderHTML: (attrs) => {
          if (!attrs.fontSize) return {};
          return { style: `font-size: ${attrs.fontSize}` };
        },
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showEmoji, setShowEmoji] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      FontSize,
      Color,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content]);

  if (!editor) return null;

  const setFontSize = (size: string) => {
    editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
  };

  return (
    <div className="border border-input rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-input bg-muted/30">
        <Button type="button" variant={editor.isActive("bold") ? "default" : "ghost"} size="icon" className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant={editor.isActive("italic") ? "default" : "ghost"} size="icon" className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-0.5" />
        <Button type="button" variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"} size="icon" className="h-7 w-7"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"} size="icon" className="h-7 w-7"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"} size="icon" className="h-7 w-7"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-0.5" />
        {/* Font Size */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
              <Type className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-wrap gap-1">
              {FONT_SIZES.map((s) => (
                <Button key={s} type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setFontSize(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {/* Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
              <Palette className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-wrap gap-1.5 max-w-[160px]">
              {COLORS.map((c) => (
                <button key={c} type="button" className="h-6 w-6 rounded-full border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  onClick={() => editor.chain().focus().setColor(c).run()} />
              ))}
            </div>
            <Input type="color" className="h-7 w-full mt-2 p-0 border-0" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
          </PopoverContent>
        </Popover>
        {/* Emoji */}
        <Popover open={showEmoji} onOpenChange={setShowEmoji}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
              <Smile className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-5 gap-1">
              {EMOJIS.map((e) => (
                <button key={e} type="button" className="h-8 w-8 text-lg hover:bg-accent rounded transition-colors"
                  onClick={() => { editor.chain().focus().insertContent(e).run(); setShowEmoji(false); }}>
                  {e}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {/* Editor */}
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-3 min-h-[100px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[80px]" />
    </div>
  );
}
