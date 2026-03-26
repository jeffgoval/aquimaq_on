import React from 'react';
import { ORDER_STATUS_CONFIG } from '@/constants/orderStatus';

interface StatusBadgeProps {
    status: string;
    /** Usa shortLabel em vez de label completo (default: false) */
    short?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, short = false }) => {
    const cfg = ORDER_STATUS_CONFIG[status];
    if (!cfg) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-500">{status}</span>;

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
            {short ? cfg.shortLabel : cfg.label}
        </span>
    );
};
