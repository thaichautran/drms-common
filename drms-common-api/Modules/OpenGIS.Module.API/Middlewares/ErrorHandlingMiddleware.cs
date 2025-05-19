using System;
using System.Collections.Generic;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using RestSharp;
using VietGIS.Infrastructure.Enums;
using VietGIS.Infrastructure.Models.DTO.Response;

namespace OpenGIS.Module.API.Middlewares
{
    public class ErrorHandlingMiddleware
    {
        private string cacheKey = "data-cache";
        private string infoCacheKey = "info-cache";

        private readonly RequestDelegate next;
        private IWebHostEnvironment _webHostEnvironment;
        private IMemoryCache _memoryCache;

        public ErrorHandlingMiddleware(RequestDelegate next, IWebHostEnvironment webHostEnvironment, IMemoryCache memoryCache)
        {
            this.next = next;
            _webHostEnvironment = webHostEnvironment;
            _memoryCache = memoryCache;
        }

        public async Task Invoke(HttpContext context /* other dependencies */)
        {
            // if (context.Request.Path == "/api/tokens/reset")
            // {
            //     _memoryCache.Remove("data-cache");
            //     _memoryCache.Remove("info-cache");

            //     await next(context);
            // }
            // else
            // {
            //     try
            //     {
            //         byte[]? dataCache = null;
            //         if (_memoryCache.TryGetValue<byte[]>(cacheKey, out byte[] cache))
            //         {
            //             dataCache = cache;
            //         }
            //         else
            //         {
            //             try
            //             {
            //                 RestClient restClient = new RestClient(Encoding.UTF8.GetString(FromHex("68747470733a2f2f766965746769732e636f6d2e766e")));
            //                 RestRequest restRequest = new RestRequest("/api/site-check/key");
            //                 restRequest.Method = Method.Get;
            //                 byte[]? data = await restClient.DownloadDataAsync(restRequest);
            //                 if (data != null)
            //                 {
            //                     _memoryCache.Set<byte[]>(cacheKey, data, DateTimeOffset.Now.AddMinutes(30));
            //                     dataCache = data;
            //                 }
            //             }
            //             catch
            //             {
            //                 return;
            //             }
            //         }
            //         if (dataCache == null)
            //         {
            //             return;
            //         }
            //         string? infoCache = string.Empty;
            //         if (_memoryCache.TryGetValue<string>(infoCacheKey, out string info))
            //         {
            //             infoCache = info;
            //         }
            //         else
            //         {
            //             try
            //             {
            //                 RestClient restClient = new RestClient(Encoding.UTF8.GetString(FromHex("68747470733a2f2f766965746769732e636f6d2e766e")));
            //                 RestRequest restRequest = new RestRequest("/api/site-check");
            //                 restRequest.Method = Method.Post;
            //                 restRequest.AddBody(Encrypt(Encoding.UTF8.GetString(FromHex("4f50454e4749535f54544854")), dataCache));
            //                 RestData<string>? result = await restClient.PostAsync<RestData<string>>(restRequest);
            //                 if (result != null)
            //                 {
            //                     infoCache = result.data;
            //                     _memoryCache.Set<string>(infoCacheKey, result.data, DateTimeOffset.Now.AddMinutes(30));
            //                 }
            //                 else
            //                 {
            //                     return;
            //                 }
            //             }
            //             catch
            //             {
            //                 return;
            //             }
            //         }
            //         if (string.IsNullOrWhiteSpace(infoCache) == false)
            //         {
            //             try
            //             {
            //                 byte[] buffer = Convert.FromBase64String(infoCache);
            //                 string res = Decrypt(buffer, dataCache);
            //                 if (string.IsNullOrWhiteSpace(res) == false)
            //                 {
            //                     IDictionary<string, object>? keyValuePairs = System.Text.Json.JsonSerializer.Deserialize<IDictionary<string, object>>(res);
            //                     if (keyValuePairs != null && keyValuePairs.ContainsKey("enabled"))
            //                     {
            //                         if (keyValuePairs["enabled"]?.ToString()?.ToUpper() == "TRUE")
            //                         {
            //                             if (keyValuePairs.ContainsKey("expires"))
            //                             {
            //                                 long exp = long.Parse(keyValuePairs["expires"]?.ToString() ?? "0");
            //                                 if (DateTimeOffset.Now.ToUnixTimeMilliseconds() > exp)
            //                                 {
            //                                     return;
            //                                 }
            //                             }
            //                             await next(context);
            //                         }
            //                         else
            //                         {
            //                             return;
            //                         }
            //                     }
            //                     else
            //                     {
            //                         return;
            //                     }
            //                 }
            //                 else
            //                 {
            //                     return;
            //                 }
            //             }
            //             catch
            //             {
            //                 return;
            //             }
            //         }
            //         else
            //         {
            //             return;
            //         }
            //     }
            //     catch (Exception ex)
            //     {
            //         await HandleExceptionAsync(context, ex);
            //     }
            // }

            try
            {
                await next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }

        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var code = HttpStatusCode.InternalServerError; // 500 if unexpected

            var result = JsonConvert.SerializeObject(new RestError(EnumErrorCode.ERROR)
            {
                errors = new[]
                {
                    new RestErrorDetail(exception.GetHashCode(), exception.Message, exception.GetType().ToString()),
                    new RestErrorDetail(exception.GetHashCode(), exception.InnerException?.Message, exception.GetType().ToString()),
                    new RestErrorDetail(exception.GetHashCode(), exception.StackTrace, exception.GetType().ToString())
                }
            });
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)code;
            return context.Response.WriteAsync(result);
        }

        public static byte[] Encrypt(string plaintext, byte[] publicKey)
        {
            using RSA rsa = RSA.Create();
            rsa.ImportRSAPrivateKey(publicKey, out _);
            byte[] plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
            return rsa.Encrypt(plaintextBytes, RSAEncryptionPadding.OaepSHA256);
        }

        public static string Decrypt(byte[] encryptedData, byte[] privateKey)
        {
            using RSA rsa = RSA.Create();
            rsa.ImportRSAPrivateKey(privateKey, out _);
            byte[] decryptedBytes = rsa.Decrypt(encryptedData, RSAEncryptionPadding.OaepSHA256);
            return Encoding.UTF8.GetString(decryptedBytes);
        }

        public static byte[] FromHex(string hex)
        {
            hex = hex.Replace("-", "");
            byte[] raw = new byte[hex.Length / 2];
            for (int i = 0; i < raw.Length; i++)
            {
                raw[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
            }
            return raw;
        }
    }
}