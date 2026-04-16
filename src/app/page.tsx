import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            💸 TripSplit
          </h1>
          <p className="text-xl text-gray-600">
            Split expenses with friends. Track payments in real-time. Settle up fairly.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            How it works
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Create a trip</h3>
                <p className="text-gray-600 text-sm">Set up a trip with your friends</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Add expenses</h3>
                <p className="text-gray-600 text-sm">Track who paid for what, in any currency</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Settle up</h3>
                <p className="text-gray-600 text-sm">See who owes whom, minimized to fewest transactions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/trips/new"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-colors text-center text-lg"
          >
            Create a Trip
          </Link>
          <Link
            href="/trips"
            className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-8 rounded-xl shadow-lg transition-colors text-center text-lg border border-gray-200"
          >
            View Trips
          </Link>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>✨ Multi-currency • 🧮 Smart calculations • 📱 Mobile-friendly</p>
        </div>
      </div>
    </div>
  );
}
