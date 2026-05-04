const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export default function Modal({ title, onClose, children, size = 'md' }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={`w-full ${sizeMap[size] || sizeMap.md}`}>
                <div className="ol-card shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <h5 className="text-[16px] font-semibold text-dark m-0">{title}</h5>
                        <button type="button" className="text-gray hover:text-dark text-xl leading-none" onClick={onClose}>×</button>
                    </div>
                    <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
                </div>
            </div>
        </div>
    );
}
