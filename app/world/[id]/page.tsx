import {notFound} from 'next/navigation';
import {conceptFor} from '../../../lib/worlds/concepts';
import WorldPage from '../../../components/worlds/WorldPage';
export default async function LivingBook({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!conceptFor(id))notFound();return <WorldPage id={id}/>;
}
