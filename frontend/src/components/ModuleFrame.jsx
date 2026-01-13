function ModuleFrame({ module }) {
  if (!module || !module.available) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground/80 mb-2">
            Module Unavailable
          </h3>
          <p className="text-foreground/60">
            {module?.name} is currently not available. Please check if the service is running.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      <iframe
        src={module.url}
        className="absolute inset-0 w-full h-full border-0"
        title={module.name}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
      />
    </div>
  )
}

export default ModuleFrame
