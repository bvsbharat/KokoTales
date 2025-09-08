import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-comic-black group-[.toaster]:border-4 group-[.toaster]:border-black group-[.toaster]:shadow-comic font-bold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-comic-blue group-[.toast]:text-white group-[.toast]:border-2 group-[.toast]:border-black",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:border-2 group-[.toast]:border-black",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }