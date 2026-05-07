import { useContext } from 'react';
import { CollegeContext } from '../context/CollegeContext';

export const useCollege = () => {
  const context = useContext(CollegeContext);
  if (!context) {
    throw new Error('useCollege must be used within a CollegeProvider');
  }
  return context;
};