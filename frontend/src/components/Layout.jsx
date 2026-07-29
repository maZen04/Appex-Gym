import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Topbar title={title} subtitle={subtitle} />
        <main className="p-8 pt-0">{children}</main>
      </div>
    </div>
  );
}
