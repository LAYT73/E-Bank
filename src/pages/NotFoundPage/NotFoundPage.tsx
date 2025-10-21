import './NotFoundPage.module.scss';
import React from 'react';

interface INotFoundPageProps {}

const NotFoundPage: React.FC<INotFoundPageProps> = () => {
  return <div className="min-h-full flex items-center justify-center">404</div>;
};

export default NotFoundPage;
