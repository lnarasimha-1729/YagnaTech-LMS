export default function ConfirmDialog({ message = 'Are you sure?', onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm">
                <div className="ol-card shadow-xl">
                    <div className="p-6 text-center">
                        <p className="mb-5 text-[14px] text-dark">{message}</p>
                        <button className="ol-btn-outline-secondary mr-2" onClick={onCancel}>Cancel</button>
                        <button className="ol-btn-danger" onClick={onConfirm}>Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
