import Modal from '@/components/common/Modal';

export default function LessonModal({ open, isOpen, onClose, onSuccess, lesson, sectionId, courseId, type }) {
  return (
    <Modal open={open ?? isOpen} onClose={onClose} title={lesson ? 'Edit Lesson' : 'Add Lesson'}>
      <p className="text-sm text-gray-500">Lesson editor not yet ported.</p>
    </Modal>
  );
}
