import React from 'react';

const ProductSkeleton: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="flex items-center mb-6">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden md:flex">
                {/* Gallery Skeleton */}
                <div className="md:w-1/2 bg-gray-50 border-r border-gray-100 h-[400px]"></div>

                {/* Details Skeleton */}
                <div className="p-6 md:p-8 md:w-1/2 flex flex-col">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>

                    <div className="flex mb-6">
                        <div className="h-4 w-24 bg-gray-200 rounded mr-2"></div>
                        <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    </div>

                    <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded mb-6"></div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6 h-24"></div>

                    <div className="mt-auto">
                        <div className="h-10 w-48 bg-gray-200 rounded mb-4"></div>
                        <div className="h-12 w-full bg-gray-200 rounded mb-3"></div>
                        <div className="h-12 w-full bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-80 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductSkeleton;
