import React from 'react';
import { Bold, Italic, List } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  placeholder,
}) => {
  const { theme } = useTheme();
  
  const applyFormat = (format: string) => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'list':
        formattedText = `\n- ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }

    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);
  };

  const labelClass = theme === 'light' 
    ? 'text-sm font-medium text-gray-700 mb-2' 
    : 'text-sm font-medium text-orange-300 mb-2';
    
  const containerClass = theme === 'light'
    ? 'bg-white rounded-xl overflow-hidden border border-gray-300'
    : 'bg-white/5 rounded-xl overflow-hidden border border-orange-500/30';
    
  const toolbarClass = theme === 'light'
    ? 'flex gap-2 p-3 border-b border-gray-200 bg-gray-50'
    : 'flex gap-2 p-3 border-b border-orange-500/20 bg-white/5';
    
  const buttonClass = theme === 'light'
    ? 'p-2 hover:bg-gray-200 rounded transition-colors text-gray-600'
    : 'p-2 hover:bg-orange-500/20 rounded transition-colors text-orange-400';
    
  const textareaClass = theme === 'light'
    ? 'w-full p-4 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none resize-none'
    : 'w-full p-4 bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none';
    
  const counterClass = theme === 'light'
    ? 'text-xs text-gray-500 mt-2'
    : 'text-xs text-orange-400/60 mt-2';

  return (
    <div className="flex flex-col">
      <label className={labelClass}>{label}</label>
      <div className={containerClass}>
        {/* Toolbar */}
        <div className={toolbarClass}>
          <button
            onClick={() => applyFormat('bold')}
            className={buttonClass}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => applyFormat('italic')}
            className={buttonClass}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <button
            onClick={() => applyFormat('list')}
            className={buttonClass}
            title="List"
          >
            <List size={18} />
          </button>
        </div>

        {/* Editor */}
        <textarea
          id="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={textareaClass}
          rows={6}
        />
      </div>
      <div className={counterClass}>{value.length} characters</div>
    </div>
  );
};

export default RichTextEditor;
