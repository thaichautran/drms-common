using System.Data;
using Dapper;
using NetTopologySuite.Geometries;
using Npgsql;
using NpgsqlTypes;

namespace OpenGIS.Web.Implements
{
    public class GeometryTypeMapper : SqlMapper.TypeHandler<Geometry>
    {
        public override void SetValue(IDbDataParameter parameter, Geometry value)
        {
            if (parameter is NpgsqlParameter npgsqlParameter)
            {
                npgsqlParameter.NpgsqlDbType = NpgsqlDbType.Geometry;
                npgsqlParameter.NpgsqlValue = value;
            }
            else
            {
                throw new ArgumentException();
            }
        }

        public override Geometry Parse(object value)
        {
            if (value is Geometry geometry)
            {
                return geometry;
            }

            throw new ArgumentException();
        }
    }
}