export default function Footer() {
  return (
    <div className="p-4 border-t border-gray-200 mt-auto">
      <p className="text-[11px] text-gray-800 text-center leading-relaxed">
        © {new Date().getFullYear()} Created by{' '}
        <a 
          href="https://lakeshorestudios.ch/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-brandblue underline hover:no-underline"
        >
          lakeshorestudios
        </a>
        <br />
        Made with AI • v.1.0.0
      </p>
    </div>
  )
}
