import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs text-muted-foreground my-4 px-4 sm:px-0">
      <Link to="/" className="flex items-center hover:text-primary transition-colors">
        <Home className="h-3.5 w-3.5 mr-1" /> Home
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formattedName = name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        return (
          <React.Fragment key={name}>
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            {isLast ? (
              <span className="font-semibold text-foreground">{formattedName}</span>
            ) : (
              <Link to={routeTo} className="hover:text-primary transition-colors">
                {formattedName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
