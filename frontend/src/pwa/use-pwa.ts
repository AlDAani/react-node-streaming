import { useContext } from 'react';
import { PwaContext } from '@/pwa/pwa-context';

export const usePwa = () => useContext(PwaContext);
