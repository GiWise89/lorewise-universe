import {notFound} from 'next/navigation';
import {FamiglioNpcReview} from '@/components/FamiglioNpcReview';
export const dynamic='force-dynamic';
export default function Page(){
 if(process.env.NODE_ENV!=='development')notFound();
 return <FamiglioNpcReview/>;
}
