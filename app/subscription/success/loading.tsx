export default function Loading() {
 return (
   <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
     <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
       <div className="space-y-4">
         <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
         <div className="h-4 bg-gray-200 rounded animate-pulse"></div>

         <div className="flex justify-center py-8">
           <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse"></div>
         </div>

         <div className="space-y-2">
           <div className="flex justify-between">
             <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
             <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
           </div>
           <div className="flex justify-between">
             <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
             <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
           </div>
           <div className="flex justify-between">
             <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
             <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
           </div>
           <div className="flex justify-between">
             <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
             <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
           </div>
         </div>

         <div className="h-10 bg-gray-200 rounded animate-pulse mt-6"></div>
       </div>
     </div>
   </div>
 )
}
