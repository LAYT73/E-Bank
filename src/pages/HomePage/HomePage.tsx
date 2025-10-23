import './HomePage.module.scss';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { ThemeToggle } from '@/shared/components';
import { useDI } from '@/shared/di/di-container';
import { useTryCatch } from '@/shared/hooks/useTryCatch';

interface IHomePageProps {}

interface IUser {
  id: number;
  title: string;
}

const HomePage: React.FC<IHomePageProps> = () => {
  const { httpClient } = useDI();
  const { data, error, loading, execute } = useTryCatch<IUser[]>(() =>
    httpClient.get<IUser[]>(API_ENDPOINTS.todos.list(), {
      cache: {
        enabled: true,
        strategy: 'cache-first',
        ttl: 5000,
      },
    }),
  );
  useEffect(() => {
    execute();
  }, [execute]);

  // Example UI ниже этого комментария не оценивать
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="flex gap-4 items-center justify-center">
      {data && (
        <ul>
          {data.map((user, index) => (
            <li key={index}>{user.title}</li>
          ))}
        </ul>
      )}
      <button onClick={execute}>Reload Users</button>
      <ThemeToggle />
      <Link to="/about">Go to About Page</Link>
    </div>
  );
};

export default HomePage;
