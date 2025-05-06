/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { ReactMarkdownRendererProps } from './types';
import './styles.css';

export const ReactMarkdownRenderer: React.FC<ReactMarkdownRendererProps> = ({ content, role }) => {
    const [isTypingComplete, setIsTypingComplete] = useState(role === 'user');
    const [currentIndex, setCurrentIndex] = useState(1);
    const contentRef = useRef<HTMLDivElement>(null);
    const lines = content.split('\n');

    // Find code block ranges
    const codeBlocks: [number, number][] = [];
    let inCodeBlock = false;
    let startIndex = 0;

    lines.forEach((line, index) => {
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                startIndex = index;
                inCodeBlock = true;
            } else {
                codeBlocks.push([startIndex, index]);
                inCodeBlock = false;
            }
        }
    });

    // Get the content to display
    const getDisplayContent = () => {
        if (role === 'user' || isTypingComplete) return content;

        const displayLines = [];
        let currentLine = 0;

        while (currentLine < currentIndex) {
            // Check if this line is part of a code block
            const codeBlock = codeBlocks.find(
                ([start, end]) => currentLine >= start && currentLine <= end
            );

            if (codeBlock) {
                // Add the entire code block
                displayLines.push(...lines.slice(codeBlock[0], codeBlock[1] + 1));
                currentLine = codeBlock[1] + 1;
            } else {
                // Add single line
                displayLines.push(lines[currentLine]);
                currentLine++;
            }
        }

        return displayLines.join('\n');
    };

    // Handle typing animation
    useEffect(() => {
        if (role === 'assistant' && !isTypingComplete && currentIndex <= lines.length) {
            const timeout = setTimeout(() => {
                if (currentIndex === lines.length) {
                    setIsTypingComplete(true);
                } else {
                    // Skip code block lines
                    const nextIndex = codeBlocks.find(
                        ([start, end]) => currentIndex >= start && currentIndex <= end
                    );
                    if (nextIndex) {
                        setCurrentIndex(nextIndex[1] + 1);
                    } else {
                        setCurrentIndex((prev) => prev + 1);
                    }
                }
            }, 30);
            return () => clearTimeout(timeout);
        }
    }, [role, isTypingComplete, currentIndex, lines.length, codeBlocks]);

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    const components: any = {
        pre: ({ children }: any) => {
            // First convert children to array if it's not already
            const childrenArray = React.Children.toArray(children);

            // Find the code element
            const codeContent = childrenArray.find((child: any) => {
                if (!React.isValidElement(child)) return false;
                
                interface CodeProps {
                    node?: { tagName?: string };
                    children?: any;
                }
                
                const props = child.props as CodeProps;
                if (child.type === 'code') return true;
                if (props.node?.tagName === 'code') return true;
                return false;
            });

            // Extract the code content
            let code = '';
            if (codeContent && React.isValidElement(codeContent)) {
                const props = codeContent.props as any;
                if (typeof props.children === 'string') {
                    code = props.children.trim();
                } else if (props.children?.props?.children && typeof props.children.props.children === 'string') {
                    code = props.children.props.children.trim();
                } else if (props.children) {
                    code = String(props.children).trim();
                }
            }
            
            // Get language from className or props
            let language = 'text';
            const props = (codeContent as any)?.props || {};
            const className = props.className || props.node?.properties?.className || '';
            if (typeof className === 'string' && className.includes('language-')) {
                language = className.split('language-')[1];
            }

            return (
                <div className="react-code-block-wrapper">
                    <div className="react-code-block-header">
                        <span className="react-code-language">{language}</span>
                        <button
                            onClick={() => handleCopyCode(code)}
                            className="react-code-copy-button"
                            title="Copy code"
                        >
                            <span className="material-icons">content_copy</span>
                        </button>
                    </div>
                    <div className="react-code-block">
                        <SyntaxHighlighter
                            language={language}
                            style={vscDarkPlus}
                            showLineNumbers={true}
                        >
                            {code}
                        </SyntaxHighlighter>
                    </div>
                </div>
            );
        },
        code: ({ inline, children }: any) => {
            return inline ? (
                <code className="react-inline-code">{children}</code>
            ) : (
                <code>{children}</code>
            );
        },
        p: ({ children }: any) => (
            <p className="react-markdown-paragraph">{children}</p>
        ),
        h1: ({ children }: any) => (
            <h1 className="react-markdown-h1">{children}</h1>
        ),
        h2: ({ children }: any) => (
            <h2 className="react-markdown-h2">{children}</h2>
        ),
        h3: ({ children }: any) => (
            <h3 className="react-markdown-h3">{children}</h3>
        ),
        li: ({ children }: any) => (
            <li className="react-markdown-list-item">{children}</li>
        ),
        ul: ({ children }: any) => (
            <ul className="react-markdown-list">{children}</ul>
        ),
        ol: ({ children }: any) => (
            <ol className="react-markdown-list">{children}</ol>
        ),
        table: ({ children }: any) => (
            <div className="react-markdown-table-wrapper">
                <table className="react-markdown-table">{children}</table>
            </div>
        ),
    };

    return (
        <div ref={contentRef} className="react-markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {getDisplayContent()}
            </ReactMarkdown>
            {role === 'assistant' && !isTypingComplete && (
                <span className="typing-cursor" />
            )}
        </div>
    );
}; 