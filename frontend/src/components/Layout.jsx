import ModuleFrame from './ModuleFrame'

function Layout({ modules, selectedModule, onSelectModule, onLogout, loading }) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 bg-secondary border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold">AI Platform</h1>
          <p className="text-xs text-foreground/60">Unified Workspace</p>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-semibold text-foreground/50 uppercase mb-2">
            Modules
          </div>
          {loading ? (
            <div className="text-sm text-foreground/60">Loading modules...</div>
          ) : (
            modules.map((module) => (
              <button
                key={module.id}
                onClick={() => onSelectModule(module)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedModule?.id === module.id
                    ? 'bg-accent text-foreground'
                    : 'hover:bg-accent/50 text-foreground/80'
                } ${!module.available ? 'opacity-50' : ''}`}
                disabled={!module.available}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{module.name}</div>
                    <div className="text-xs text-foreground/60">{module.category}</div>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      module.available ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    title={module.available ? 'Available' : 'Unavailable'}
                  />
                </div>
              </button>
            ))
          )}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="text-xs font-semibold text-foreground/50 uppercase mb-2">
            User
          </div>
          <div className="px-3 py-2 bg-background rounded-md">
            <div className="text-sm font-medium">Admin User</div>
            <div className="text-xs text-foreground/60">admin@example.com</div>
          </div>
          <button
            onClick={onLogout}
            className="w-full px-3 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedModule ? (
          <>
            {/* Module Header */}
            <div className="h-14 border-b border-border flex items-center px-6">
              <h2 className="text-lg font-semibold">{selectedModule.name}</h2>
              <span className="ml-3 text-sm text-foreground/60">
                {selectedModule.description}
              </span>
            </div>
            {/* Module Content */}
            <ModuleFrame module={selectedModule} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground/80 mb-2">
                Welcome to AI Platform Wrapper
              </h2>
              <p className="text-foreground/60">
                Select a module from the sidebar to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Layout
