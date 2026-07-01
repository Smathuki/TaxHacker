import Link from "next/link"

export default async function KenyaTaxGuide() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Kenya Tax Guide: VAT, Turnover Tax and eTIMS</h1>

      <p className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
        <strong className="text-amber-600">⚠️ Not tax advice.</strong> This page is a plain-language orientation, not a
        substitute for KRA guidance or a licensed tax advisor. Rates and thresholds change &mdash; always confirm the
        current figures on{" "}
        <Link href="https://www.kra.go.ke" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
          kra.go.ke
        </Link>{" "}
        before filing.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">VAT vs. Turnover Tax</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        A Kenyan business is normally on one of these two regimes, not both:
      </p>
      <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">
        <li>
          <strong>VAT (Value Added Tax)</strong>: standard rate 16%. Registration is mandatory once annual turnover
          exceeds KES 5 million. VAT-registered businesses charge output VAT on sales, reclaim input VAT on
          purchases, and file the difference monthly (due the 20th).
        </li>
        <li>
          <strong>Turnover Tax (TOT)</strong>: 1.5% of gross monthly sales (reduced from 3% by the Finance Act 2024),
          for resident businesses with annual turnover between KES 1 million and 25 million that are not VAT
          registered. TOT is charged on gross turnover with no deduction for expenses or input tax.
        </li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-6">
        Use the <strong>Kenya Tax Reports</strong> app to see both a VAT Return Summary and a Turnover Tax Summary for
        any period &mdash; only one will normally apply to your business.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">What is eTIMS?</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        eTIMS (Electronic Tax Invoice Management System) is KRA&apos;s system for real-time electronic invoicing.
        Since 2023, businesses are expected to issue eTIMS-compliant invoices, and expenses backed by a non-compliant
        supplier invoice can be disallowed for tax deduction or input VAT purposes. A compliant invoice generally
        includes:
      </p>
      <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">
        <li>The seller&apos;s KRA PIN</li>
        <li>A unique eTIMS invoice number and a Control Unit (CU) invoice number</li>
        <li>A tax code (A/B/C/E) showing whether the supply is exempt, standard-rated (16%), or zero-rated</li>
        <li>A QR code you or KRA can use to verify the invoice</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-6">
        This app automatically looks for these fields when it scans an invoice, and the{" "}
        <strong>eTIMS Compliance Check</strong> app flags expense transactions where they&apos;re missing or don&apos;t
        match the expected format. To verify a specific invoice with KRA directly, use the{" "}
        <Link
          href="https://ecitizen.kra.go.ke/checkers/Checkers-Invoice-No"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          iTax invoice checker
        </Link>
        .
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Other things this app tags</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">
        <li>
          <strong>Withholding Tax (WHT)</strong>: deducted at source on certain payments (e.g. professional and
          management fees); tracked via the Withholding Tax Rate/Amount fields.
        </li>
        <li>
          <strong>NSSF and SHIF</strong>: statutory payroll contributions, tracked under the "NSSF and SHIF
          Contributions" category.
        </li>
        <li>
          <strong>PAYE</strong>: staff payroll costs are tracked under "Salaries and Wages (PAYE)", but this app does
          not calculate PAYE bands &mdash; use KRA&apos;s PAYE tables or your payroll provider for that.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Sources</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">
        <li>
          <Link href="https://www.kra.go.ke/individual/filing-paying/types-of-taxes/value-added-tax" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            KRA: Value Added Tax
          </Link>
        </li>
        <li>
          <Link href="https://www.kra.go.ke/individual/filing-paying/types-of-taxes/turnover-tax-tot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            KRA: Turnover Tax (TOT)
          </Link>
        </li>
        <li>
          <Link href="https://www.kra.go.ke/online-services/etims" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            KRA: eTIMS
          </Link>
        </li>
        <li>
          <Link href="https://www.kra.go.ke/images/publications/TIS-for-OSCU--VSCU-Technical-Specifications-v2.0.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            KRA: Technical Specification for the Trader Invoicing System (TIS)
          </Link>
        </li>
      </ul>
    </div>
  )
}
