import { useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import {
  useBatchImportPreview,
  useBatchImportExecute,
  BatchImportPreview,
  BatchImportResult,
} from '../hooks/useBatchImport'

export default function AdminBatchImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [jsonData, setJsonData] = useState<any>(null)
  const [preview, setPreview] = useState<BatchImportPreview | null>(null)
  const [result, setResult] = useState<BatchImportResult | null>(null)
  const [error, setError] = useState('')

  const previewMutation = useBatchImportPreview()
  const executeMutation = useBatchImportExecute()

  const handleLoadFile = async () => {
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      setJsonData(data)
      setError('')

      // Call preview API
      const previewed = await previewMutation.mutateAsync(data)
      setPreview(previewed)
    } catch (err: any) {
      setError(err.message || 'Failed to load file')
      setPreview(null)
    }
  }

  const handleDownloadTemplate = () => {
    const template = {
      items: [
        {
          name: 'Iron Ore',
          type: 'material',
          rarity: 'common',
          base_durability: 0,
          repair_cost: 0,
          repair_materials: {},
          properties: { weight: 5, stack_size: 99 },
        },
        {
          name: 'Wood Plank',
          type: 'material',
          rarity: 'common',
          base_durability: 0,
          repair_cost: 0,
          repair_materials: {},
          properties: { weight: 2, stack_size: 64 },
        },
      ],
      recipes: [
        {
          name: 'Craft Iron Sword',
          description: 'Basic iron weapon',
          result_item_name: 'Iron Sword',
          success_rate: 80,
          required_skill_level: 5,
          crafting_time_ms: 5000,
          discoverable: true,
          ingredients: [
            { item_name: 'Iron Ore', quantity: 3, position: 0, optional: false },
            { item_name: 'Wood Plank', quantity: 1, position: 1, optional: false },
          ],
        },
      ],
    }

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-template.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExecute = async () => {
    if (!jsonData) return

    try {
      const executed = await executeMutation.mutateAsync(jsonData)
      setResult(executed)
      setPreview(null)
    } catch (err: any) {
      setError(err.message || 'Failed to execute import')
    }
  }

  const handleCancel = () => {
    setPreview(null)
    setError('')
  }

  const handleReset = () => {
    setFile(null)
    setJsonData(null)
    setPreview(null)
    setResult(null)
    setError('')
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Batch Import</h1>

        {/* Step 1: File Upload */}
        {!preview && !result && (
          <FileUploadSection
            file={file}
            setFile={setFile}
            loading={previewMutation.isPending}
            onLoadFile={handleLoadFile}
            onDownloadTemplate={handleDownloadTemplate}
            error={error}
          />
        )}

        {/* Step 2: Preview (after upload) */}
        {preview && !result && (
          <PreviewSection
            preview={preview}
            loading={executeMutation.isPending}
            onExecute={handleExecute}
            onCancel={handleCancel}
          />
        )}

        {/* Step 3: Results (after execute) */}
        {result && <ResultsSection result={result} onReset={handleReset} />}
      </div>
    </AdminLayout>
  )
}

interface FileUploadSectionProps {
  file: File | null
  setFile: (f: File | null) => void
  loading: boolean
  onLoadFile: () => void
  onDownloadTemplate: () => void
  error: string
}

function FileUploadSection({
  file,
  setFile,
  loading,
  onLoadFile,
  onDownloadTemplate,
  error,
}: FileUploadSectionProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Upload JSON File</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-200">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select JSON file
        </label>
        <input
          type="file"
          accept=".json"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onLoadFile}
          disabled={!file || loading}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Validating...' : 'Load & Preview'}
        </button>

        <button
          onClick={onDownloadTemplate}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          Download Template
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-400">
        <p className="font-semibold mb-2">JSON Format:</p>
        <pre className="bg-gray-900 p-3 rounded overflow-auto text-xs">
{`{
  "items": [
    {
      "name": "Item Name",
      "type": "material|weapon|armor|consumable",
      "rarity": "common|uncommon|rare|epic|legendary",
      "base_durability": 0,
      "repair_cost": 0,
      "repair_materials": {},
      "properties": {}
    }
  ],
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "...",
      "result_item_name": "Item Name",
      "success_rate": 80,
      "required_skill_level": 0,
      "crafting_time_ms": 5000,
      "discoverable": true,
      "ingredients": [
        {
          "item_name": "Item Name",
          "quantity": 1,
          "position": 0,
          "optional": false
        }
      ]
    }
  ]
}`}
        </pre>
      </div>
    </div>
  )
}

interface PreviewSectionProps {
  preview: BatchImportPreview
  loading: boolean
  onExecute: () => void
  onCancel: () => void
}

function PreviewSection({
  preview,
  loading,
  onExecute,
  onCancel,
}: PreviewSectionProps) {
  const hasErrors =
    preview.summary.items_error > 0 || preview.summary.recipes_error > 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Items"
          create={preview.summary.items_create}
          update={preview.summary.items_update}
          error={preview.summary.items_error}
        />
        <StatCard
          title="Recipes"
          create={preview.summary.recipes_create}
          update={preview.summary.recipes_update}
          error={preview.summary.recipes_error}
        />
      </div>

      {/* Items Preview Table */}
      {preview.items.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Items ({preview.items.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Action</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.items.map((item) => (
                  <tr key={item.name} className="border-b border-gray-700">
                    <td className="py-2 px-3">{item.name}</td>
                    <td className="py-2 px-3">
                      <ActionBadge action={item.action} />
                    </td>
                    <td className="py-2 px-3">
                      {item.errors.length > 0 ? (
                        <ErrorList errors={item.errors} />
                      ) : (
                        <span className="text-green-400">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recipes Preview Table */}
      {preview.recipes.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Recipes ({preview.recipes.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Action</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.recipes.map((recipe) => (
                  <tr key={recipe.name} className="border-b border-gray-700">
                    <td className="py-2 px-3">{recipe.name}</td>
                    <td className="py-2 px-3">
                      <ActionBadge action={recipe.action} />
                    </td>
                    <td className="py-2 px-3">
                      {recipe.errors.length > 0 ? (
                        <ErrorList errors={recipe.errors} />
                      ) : (
                        <span className="text-green-400">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={onExecute}
          disabled={hasErrors || loading}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Importing...' : 'Execute Import'}
        </button>
      </div>
    </div>
  )
}

interface ResultsSectionProps {
  result: BatchImportResult
  onReset: () => void
}

function ResultsSection({ result, onReset }: ResultsSectionProps) {
  const totalCreated =
    result.summary.items_created + result.summary.recipes_created
  const totalUpdated =
    result.summary.items_updated + result.summary.recipes_updated
  const totalSkipped =
    result.summary.items_skipped + result.summary.recipes_skipped

  const hasErrors = result.items.some((i) => !i.success) ||
    result.recipes.some((r) => !r.success)

  return (
    <div className="space-y-6">
      <div
        className={`p-4 rounded border ${
          hasErrors
            ? 'bg-yellow-900 border-yellow-600'
            : 'bg-green-900 border-green-600'
        }`}
      >
        <h2 className="text-xl font-semibold mb-2">Import Complete</h2>
        <p className="text-sm">
          {totalCreated} created, {totalUpdated} updated, {totalSkipped} skipped
        </p>
      </div>

      {/* Items Results Table */}
      {result.items.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Items ({result.items.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Action</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.name} className="border-b border-gray-700">
                    <td className="py-2 px-3">{item.name}</td>
                    <td className="py-2 px-3">
                      <ActionBadge action={item.action} />
                    </td>
                    <td className="py-2 px-3">
                      {item.success ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-red-400">{item.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recipes Results Table */}
      {result.recipes.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Recipes ({result.recipes.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Action</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {result.recipes.map((recipe) => (
                  <tr key={recipe.name} className="border-b border-gray-700">
                    <td className="py-2 px-3">{recipe.name}</td>
                    <td className="py-2 px-3">
                      <ActionBadge action={recipe.action} />
                    </td>
                    <td className="py-2 px-3">
                      {recipe.success ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-red-400">{recipe.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
      >
        Import Another File
      </button>
    </div>
  )
}

interface StatCardProps {
  title: string
  create: number
  update: number
  error: number
}

function StatCard({ title, create, update, error }: StatCardProps) {
  return (
    <div className="bg-gray-800 p-4 rounded border border-gray-700">
      <h3 className="font-semibold text-lg mb-3">{title}</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Create:</span>
          <span className="text-green-400">{create}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Update:</span>
          <span className="text-blue-400">{update}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Error:</span>
          <span className={error > 0 ? 'text-red-400' : 'text-gray-500'}>
            {error}
          </span>
        </div>
      </div>
    </div>
  )
}

interface ActionBadgeProps {
  action: string
}

function ActionBadge({ action }: ActionBadgeProps) {
  const colors: Record<string, string> = {
    create: 'bg-green-900 text-green-200',
    created: 'bg-green-900 text-green-200',
    update: 'bg-blue-900 text-blue-200',
    updated: 'bg-blue-900 text-blue-200',
    error: 'bg-red-900 text-red-200',
    skipped: 'bg-gray-700 text-gray-300',
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[action] || 'bg-gray-700 text-gray-300'}`}>
      {action}
    </span>
  )
}

interface ErrorListProps {
  errors: string[]
}

function ErrorList({ errors }: ErrorListProps) {
  if (errors.length === 0) return null

  return (
    <div className="text-red-400 text-xs">
      {errors.map((err, i) => (
        <div key={i}>{err}</div>
      ))}
    </div>
  )
}
