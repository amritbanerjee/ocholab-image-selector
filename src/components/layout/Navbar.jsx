import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold">OchoLab</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-4">
            <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link to="/cards-for-review" className="text-sm font-medium transition-colors hover:text-primary">
              Cards for Review
            </Link>
            <Link to="/image-selection" className="text-sm font-medium transition-colors hover:text-primary">
              Image Selection
            </Link>
          </nav>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;