import { cn } from '@/lib/utils';

function Spinner({ className, ...props }) {
    return (
        <div className={cn('relative flex items-center justify-center w-5 h-5', className)} role="status" aria-label="Loading" {...props}>
            {/* Outer faint ring */}
            <div className="absolute inset-0 rounded-full border-[2px] border-current opacity-20"></div>
            
            {/* Primary fast spinning ring */}
            <div className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-current animate-spin" style={{ animationDuration: '1s' }}></div>
            <div className="absolute inset-0 rounded-full border-[2px] border-transparent border-r-current animate-spin opacity-50" style={{ animationDuration: '1s' }}></div>
            
            {/* Secondary reverse spinning inner ring */}
            <div className="absolute inset-[25%] rounded-full border-[2px] border-transparent border-b-current animate-spin opacity-80" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            <div className="absolute inset-[25%] rounded-full border-[2px] border-transparent border-l-current animate-spin opacity-40" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            
            {/* Inner glowing pulse */}
            <div className="absolute inset-[35%] bg-current opacity-30 rounded-full blur-[1px] animate-pulse"></div>
        </div>
    );
}
export { Spinner };
