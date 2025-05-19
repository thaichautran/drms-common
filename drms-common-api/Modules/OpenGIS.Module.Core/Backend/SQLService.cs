using System;
using System.Collections.Generic;
using System.Linq;
using Dapper;
using VietGIS.Infrastructure.Interfaces;
using VietGIS.Infrastructure.Repositories.Session;

namespace OpenGIS.Module.Core
{
    public class SQLService
    {
        protected readonly IDbFactory _dbFactory;

        public SQLService(IDbFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        public int Count(string sql, object parameters = null)
        {
            using (var session = _dbFactory.Create<INpgsqlSession>())
            {
                if (parameters == null)
                    return session.Connection.Query<int>(sql).FirstOrDefault();
                return session.Connection.Query<int>(sql, parameters).FirstOrDefault();
            }
        }

        public IEnumerable<T> Query<T>(string sql, object parameters = null)
        {
            using (var session = _dbFactory.Create<INpgsqlSession>())
            {
                if (parameters == null)
                    return session.Connection.Query<T>(sql);
                return session.Connection.Query<T>(sql, parameters);
            }
        }

        public IEnumerable<Dictionary<string, object>> QueryToDictationary(string sql, object parameters = null)
        {
            List<Dictionary<string, object>> pairs = new List<Dictionary<string, object>>();

            using (var session = _dbFactory.Create<INpgsqlSession>())
            {
                if (parameters != null)
                {
                    using (var reader = session.Connection.ExecuteReader(sql, parameters))
                    {
                        while (reader.Read())
                        {
                            pairs.Add(Enumerable.Range(0, reader.FieldCount)
                                .ToDictionary(reader.GetName, reader.GetValue));
                        }
                    }
                }
                else
                {
                    using (var reader = session.Connection.ExecuteReader(sql))
                    {
                        while (reader.Read())
                        {
                            pairs.Add(Enumerable.Range(0, reader.FieldCount)
                                .ToDictionary(reader.GetName, reader.GetValue));
                        }
                    }
                }
            }

            return pairs;
        }

        public IEnumerable<Dictionary<string, object>> QueryToDictationary(string fields, string tableName,
            string whereCondition, int numberPerPage, int currentPage, out int total, out int totalFound)
        {
            using (var session = _dbFactory.Create<INpgsqlSession>())
            {
                total = 0;
                totalFound = 0;
                List<Dictionary<string, object>> pairs = new List<Dictionary<string, object>>();
                string sql = $"SELECT {fields} FROM {tableName} WHERE {whereCondition} ORDER BY 1 ";
                //
                if (currentPage > 0)
                    sql += string.Format("OFFSET {0} ROWS FETCH NEXT {1} ROWS ONLY", numberPerPage * (currentPage - 1),
                        numberPerPage);
                //
                total = session.Connection.Query<int>($"SELECT COUNT(1) FROM {tableName}").FirstOrDefault();
                totalFound = session.Connection.Query<int>($"SELECT COUNT(1) FROM {tableName} WHERE {whereCondition}")
                    .FirstOrDefault();
                return this.QueryToDictationary(sql);
            }
        }

        public void Execute(string sql, object parameters = null)
        {
            using (var session = _dbFactory.Create<INpgsqlSession>())
            {
                if (parameters == null)
                    session.Connection.Execute(sql);
                else
                    session.Connection.Execute(sql, parameters);
            }
        }
    }
}