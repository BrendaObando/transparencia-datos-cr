import type { EstadisticaPolicial } from '../api';

interface Props {
  data: EstadisticaPolicial[];
  loading: boolean;
}

/** Tabla de los registros más recientes del cantón */
export function DataTable({ data, loading }: Props) {
  if (loading) {
    return <div className="h-40 flex items-center justify-center text-gray-500">Cargando...</div>;
  }
  if (data.length === 0) {
    return <div className="h-40 flex items-center justify-center text-gray-400">Sin datos</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-600">
            <th className="px-3 py-2 font-medium">Fecha</th>
            <th className="px-3 py-2 font-medium">Delito</th>
            <th className="px-3 py-2 font-medium">Distrito</th>
            <th className="px-3 py-2 font-medium">Nacionalidad</th>
            <th className="px-3 py-2 font-medium">Edad</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((r) => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap">{r.fecha}</td>
              <td className="px-3 py-2">{r.delito}</td>
              <td className="px-3 py-2">{r.distrito ?? '—'}</td>
              <td className="px-3 py-2">{r.victimaNacionalidad ?? '—'}</td>
              <td className="px-3 py-2">{r.victimaEdad ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
