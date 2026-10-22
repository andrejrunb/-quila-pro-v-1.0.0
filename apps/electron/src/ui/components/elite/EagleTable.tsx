import React, { useState } from 'react';

interface EagleTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export const EagleTable: React.FC<EagleTableProps> = ({ 
  children, 
  className = '', 
  emptyMessage = 'No data available',
  isEmpty = false,
  style,
  ...props 
}) => {
  return (
    <>
      <style>{`
        .eagle-table-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          transition: all 200ms ease;
          border-left: 2px solid transparent;
        }
        .eagle-table-row:nth-child(even) {
          background: rgba(15, 23, 42, 0.3);
        }
        .eagle-table-row:hover {
          background: rgba(59, 130, 246, 0.05);
          border-left-color: #3b82f6;
        }
      `}</style>
      <div style={{
        width: '100%',
        overflowX: 'auto',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(20px)',
        ...style
      }} className={className}>
        <table style={{
          width: '100%',
          textAlign: 'left',
          borderCollapse: 'collapse',
        }} {...props}>
          {children}
        </table>
        {isEmpty && (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '0.875rem'
          }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </>
  );
};

export const EagleTableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className = '', style, ...props }) => (
  <thead style={{
    background: 'rgba(30, 41, 59, 0.7)',
    position: 'sticky',
    top: 0,
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    zIndex: 10,
    ...style
  }} className={className} {...props}>
    {children}
  </thead>
);

export const EagleTableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className = '', ...props }) => (
  <tr className={`eagle-table-row ${className}`} {...props}>
    {children}
  </tr>
);

export const EagleTableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', style, ...props }) => (
  <td style={{
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#e2e8f0',
    ...style
  }} className={className} {...props}>
    {children}
  </td>
);

export const EagleTableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', style, ...props }) => (
  <th style={{
    padding: '0.75rem 1rem',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#94a3b8',
    fontWeight: 600,
    ...style
  }} className={className} {...props}>
    {children}
  </th>
);
