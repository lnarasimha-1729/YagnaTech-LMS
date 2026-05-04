import Modal from '@/components/common/Modal';

export default function QuizModal({ open, isOpen, onClose, onSuccess, quiz, sectionId, courseId }) {
  return (
    <Modal open={open ?? isOpen} onClose={onClose} title={quiz ? 'Edit Quiz' : 'Add Quiz'}>
      <p className="text-sm text-gray-500">Quiz editor not yet ported.</p>
    </Modal>
  );
}
