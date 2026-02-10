interface PageContainerProps {
  children: React.ReactNode
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="flex-1 overflow-auto p-6">
      {children}
    </div>
  )
}
