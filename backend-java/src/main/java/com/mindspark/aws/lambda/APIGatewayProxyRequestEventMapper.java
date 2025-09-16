package com.mindspark.aws.lambda;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.security.Principal;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * Mapper class to convert APIGatewayProxyRequestEvent to HttpServletRequest
 */
class APIGatewayProxyRequestEventMapper {
    
    /**
     * Creates a mock HttpServletRequest from an APIGatewayProxyRequestEvent
     * 
     * @param event the API Gateway proxy request event
     * @return a mock HttpServletRequest implementation
     */
    static HttpServletRequest createHttpServletRequest(APIGatewayProxyRequestEvent event) {
        return new HttpServletRequest() {
            @Override
            public String getMethod() {
                return event.getHttpMethod();
            }
            
            @Override
            public String getPathInfo() {
                return event.getPath();
            }

            @Override
            public String getPathTranslated() {
                return "";
            }

            @Override
            public String getQueryString() {
                Map<String, String> queryParams = event.getQueryStringParameters();
                if (queryParams == null || queryParams.isEmpty()) {
                    return null;
                }
                StringBuilder sb = new StringBuilder();
                for (Map.Entry<String, String> entry : queryParams.entrySet()) {
                    if (sb.length() > 0) sb.append("&");
                    sb.append(entry.getKey()).append("=").append(entry.getValue());
                }
                return sb.toString();
            }

            @Override
            public String getRemoteUser() {
                return "";
            }

            @Override
            public boolean isUserInRole(String s) {
                return false;
            }

            @Override
            public Principal getUserPrincipal() {
                return null;
            }

            @Override
            public String getRequestedSessionId() {
                return "";
            }

            @Override
            public String getHeader(String name) {
                Map<String, String> headers = event.getHeaders();
                return headers != null ? headers.get(name) : null;
            }
            
            @Override
            public Enumeration<String> getHeaders(String name) {
                String value = getHeader(name);
                return value != null ? 
                    Collections.enumeration(Collections.singletonList(value)) : 
                    Collections.emptyEnumeration();
            }
            
            @Override
            public Enumeration<String> getHeaderNames() {
                Map<String, String> headers = event.getHeaders();
                return headers != null ? 
                    Collections.enumeration(headers.keySet()) : 
                    Collections.emptyEnumeration();
            }
            
            @Override
            public String getContentType() {
                return getHeader("Content-Type");
            }
            
            @Override
            public int getContentLength() {
                String body = event.getBody();
                return body != null ? body.length() : 0;
            }
            
            @Override
            public java.io.BufferedReader getReader() throws IOException {
                String body = event.getBody();
                if (body == null) body = "";
                return new java.io.BufferedReader(
                    new java.io.InputStreamReader(
                        new ByteArrayInputStream(body.getBytes())
                    )
                );
            }
            
            // Implement other required methods with default/empty implementations
            @Override public String getRequestURI() { return event.getPath(); }
            @Override public StringBuffer getRequestURL() { return new StringBuffer(event.getPath()); }
            @Override public String getContextPath() { return ""; }
            @Override public String getServletPath() { return event.getPath(); }

            @Override
            public HttpSession getSession(boolean b) {
                return null;
            }

            @Override
            public HttpSession getSession() {
                return null;
            }

            @Override
            public String changeSessionId() {
                return "";
            }

            @Override
            public boolean isRequestedSessionIdValid() {
                return false;
            }

            @Override
            public boolean isRequestedSessionIdFromCookie() {
                return false;
            }

            @Override
            public boolean isRequestedSessionIdFromURL() {
                return false;
            }

            @Override
            public boolean isRequestedSessionIdFromUrl() {
                return false;
            }

            @Override public String getRemoteAddr() { return "127.0.0.1"; }
            @Override public String getRemoteHost() { return "localhost"; }
            @Override public int getRemotePort() { return 80; }
            @Override public String getLocalName() { return "localhost"; }
            @Override public String getLocalAddr() { return "127.0.0.1"; }
            @Override public int getLocalPort() { return 80; }
            @Override public String getServerName() { return "localhost"; }
            @Override public int getServerPort() { return 80; }
            @Override public String getProtocol() { return "HTTP/1.1"; }
            @Override public String getScheme() { return "https"; }
            @Override public boolean isSecure() { return true; }
            @Override public String getCharacterEncoding() { return "UTF-8"; }
            @Override public void setCharacterEncoding(String env) {}
            @Override public long getContentLengthLong() { return getContentLength(); }
            @Override public String getParameter(String name) { 
                Map<String, String> queryParams = event.getQueryStringParameters();
                return queryParams != null ? queryParams.get(name) : null;
            }
            @Override public Enumeration<String> getParameterNames() { 
                Map<String, String> queryParams = event.getQueryStringParameters();
                return queryParams != null ? 
                    Collections.enumeration(queryParams.keySet()) : 
                    Collections.emptyEnumeration();
            }
            @Override public String[] getParameterValues(String name) { 
                String value = getParameter(name);
                return value != null ? new String[]{value} : null;
            }
            @Override public Map<String, String[]> getParameterMap() { 
                Map<String, String> queryParams = event.getQueryStringParameters();
                if (queryParams == null) return new HashMap<>();
                Map<String, String[]> result = new HashMap<>();
                for (Map.Entry<String, String> entry : queryParams.entrySet()) {
                    result.put(entry.getKey(), new String[]{entry.getValue()});
                }
                return result;
            }
            @Override public String getAuthType() { return null; }
            @Override public javax.servlet.http.Cookie[] getCookies() { return new javax.servlet.http.Cookie[0]; }
            @Override public long getDateHeader(String name) { return -1; }
            @Override public int getIntHeader(String name) { return -1; }

            @Override public javax.servlet.RequestDispatcher getRequestDispatcher(String path) { return null; }
            @Override public String getRealPath(String path) { return null; }
            @Override public javax.servlet.ServletContext getServletContext() { return null; }
            @Override public javax.servlet.AsyncContext startAsync() { return null; }
            @Override public javax.servlet.AsyncContext startAsync(javax.servlet.ServletRequest servletRequest, javax.servlet.ServletResponse servletResponse) { return null; }
            @Override public boolean isAsyncStarted() { return false; }
            @Override public boolean isAsyncSupported() { return false; }
            @Override public javax.servlet.AsyncContext getAsyncContext() { return null; }
            @Override public javax.servlet.DispatcherType getDispatcherType() { return javax.servlet.DispatcherType.REQUEST; }

            @Override public boolean authenticate(HttpServletResponse response) { return false; }
            @Override public void login(String username, String password) {}
            @Override public void logout() {}
            @Override public java.util.Collection<javax.servlet.http.Part> getParts() { return null; }
            @Override public javax.servlet.http.Part getPart(String name) { return null; }
            @Override public <T extends javax.servlet.http.HttpUpgradeHandler> T upgrade(Class<T> handlerClass) { return null; }
            @Override public Object getAttribute(String name) { return null; }
            @Override public Enumeration<String> getAttributeNames() { return Collections.emptyEnumeration(); }
            @Override public javax.servlet.ServletInputStream getInputStream() throws IOException { return null; }
            @Override public java.util.Locale getLocale() { return java.util.Locale.getDefault(); }
            @Override public java.util.Enumeration<java.util.Locale> getLocales() { return Collections.enumeration(Collections.singletonList(java.util.Locale.getDefault())); }
            @Override public void setAttribute(String name, Object o) {}
            @Override public void removeAttribute(String name) {}
        };
    }
}
