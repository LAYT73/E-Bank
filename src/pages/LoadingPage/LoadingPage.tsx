import React from 'react';

import { Spinner } from '@/shared/shadcn/ui/spinner';

import styles from './LoadingPage.module.scss';

interface ILoadingPageProps {}

const LoadingPage: React.FC<ILoadingPageProps> = () => {
  return (
    <div className={styles.container}>
      <Spinner className="size-8" />
    </div>
  );
};

export default LoadingPage;
