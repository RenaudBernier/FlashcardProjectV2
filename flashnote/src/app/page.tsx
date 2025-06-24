import {DBProvider} from "@/app/components/DBContext";
import Sidebar from "@/app/components/Sidebar";
import SheetEditor from "@/app/components/SheetEditor";

export default function Home() {
  return(
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <SheetEditor />
        </div>
      </div>
  )
}

