import { getCurrentUser } from "@/lib/auth"
import { getCategories } from "@/models/categories"
import { MpesaImportTable } from "./components/mpesa-import-table"
import { manifest } from "./manifest"

export default async function MpesaImportApp() {
  const user = await getCurrentUser()
  const categories = await getCategories(user.id)

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">
            {manifest.icon} {manifest.name}
          </span>
        </h2>
      </header>
      <p className="text-muted-foreground mb-6">
        Export your statement from the M-Pesa app (Statements &rarr; Full Statement &rarr; CSV) or from Safaricom's
        self-service portal, then upload the CSV file here. Each transaction is mapped to income or expense based on
        the Paid In / Withdrawn columns, with a category guessed from the transaction details.
      </p>
      <MpesaImportTable categories={categories} />
    </div>
  )
}
