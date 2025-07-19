| Option | Component | Initial Cost (500 Students) / Month | Future Cost (100,000 Students) / Month | Calculation Details |
| :--- | :--- | :--- | :--- | :--- |
| **1. AWS Lambda + SnapStart** | Lambda Requests | $0 | ~$149 | **Initial:** 750k requests are within the 1M free tier. **Future:** (150M - 1M free) * $0.20/M |
| | Lambda Duration | $0 | ~$416 | **Initial:** GB-seconds are within the free tier. **Future:** 150M requests * 0.2s * 1GB * $0.00001667/GB-s |
| | SnapStart Restore | $0.10 | ~$20 | **Initial:** 15k restores * 0.4s * 1GB * $0.00001667/GB-s. **Future:** 3M restores * 0.4s * 1GB * $0.00001667/GB-s |
| | Database | $0 | ~$111 | DynamoDB On-Demand for ~150M R/W operations + 75GB storage. |
| | **TOTAL** | **~$0.10** | **~$696** | |
| **2. AWS Lambda + Provisioned Concurrency** | Provisioned Fee | **~$5.40** | **~$5.40** | 1 provisioned unit * 1GB * (price/GB-s) * (**12 hours/day** for 30 days) |
| | Lambda Requests | $0 | ~$149 | Same as SnapStart calculation. |
| | Lambda Duration | $0 | ~$416 | Same as SnapStart calculation. |
| | Database | $0 | ~$111 | Same as SnapStart calculation. |
| | **TOTAL** | **~$5.40** | **~$681** | |
| **3. API Gateway + Fargate** | Fargate | ~$9 | ~$1,442 | **Initial:** 0.25 vCPU + 0.5GB RAM. **Future:** 4 instances * (2 vCPU + 4GB RAM) priced per hour. |
| | API Gateway | $0 | ~$149 | Request pricing same as Lambda requests. |
| | Network Load Balancer| ~$18 | ~$18 | Required for API Gateway VPC Link, priced per hour. |
| | Database | $0 | ~$111 | Same as above. |
| | **TOTAL** | **~$27** | **~$1,720** | |
| **4. ALB + Fargate** | Fargate | ~$9 | ~$1,442 | Same as above. |
| | Application Load Balancer| ~$20 | ~$55 | Priced per hour plus a fee based on traffic volume. |
| | Database | $0 | ~$111 | Same as above. |
| | **TOTAL** | **~$29** | **~$1,608** | |
| **5. Azure Functions (Premium Plan)** | Premium Plan Fee | ~$55 | ~$220 | **Initial:** 1 EP1 instance. **Future:** 4 EP1 instances to handle load and guarantee no cold starts. |
| | Database | $0 | ~$50 | Azure Cosmos DB Serverless for ~150M operations + 75GB storage. |
| | **TOTAL** | **~$55** | **~$270** | |
| **6. Azure Container Apps** | Container Compute | ~$15 | ~$1,518 | **Initial:** 0.25 vCPU + 0.5GB RAM. **Future:** 4 instances * (2 vCPU + 4GB RAM). Ingress is included. |
| | Database | $0 | ~$50 | Same as above. |
| | **TOTAL** | **~$15** | **~$1,568** | |
| **7. Azure Functions (App Service Plan)** | App Service Plan Fee| **~$14** | **~$133** | **Initial:** 1 Basic (B1) instance with 'Always On'. **Future:** Scaled to an average of 6 B1 instances + Cosmos DB costs. |
| | Database | $0 | ~$50 | Same as above. |
| | **TOTAL** | **~$14** | **~$183** | |