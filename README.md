# Learn Portal - Backend

## Frontend part here: https://github.com/SzymonRegula/learn-portal

### User Service

prod API Gateway URL: https://6pt80mavq0.execute-api.eu-north-1.amazonaws.com

dev API Gateway URL: https://6038kolcw8.execute-api.eu-north-1.amazonaws.com

Routes:

    /auth
        /register
            POST
        /login
            POST
    /users
        /students
            GET
        /trainers
            GET
            POST
            /specializations
                GET
        /me
            PATCH
            DELETE
            GET
        /upload-photo
            POST
        /update-password
            PUT

### Training Service

prod API Gateway URL: https://71sz1gu154.execute-api.eu-north-1.amazonaws.com

dev API Gateway URL: https://yngqfz3rvl.execute-api.eu-north-1.amazonaws.com

Routes:

    /trainings
        POST
        GET
        /types
            GET
        /search
            GET
