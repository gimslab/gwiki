import React from 'react';
import { useParams } from 'react-router-dom';

const PageViewer: React.FC = () => {
  const { pageName } = useParams<{ pageName: string }>();

  return (
    <div>
      <h2>{pageName}</h2>
      {/* Page content will go here */}
    </div>
  );
};

export default PageViewer;
